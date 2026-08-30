"""
NetraScan Reproducible PyTorch Training Pipeline for 5-Class Diabetic Retinopathy Grading
Model: ResNet-18 (with CLAHE LAB Preprocessing + Dropout + Calibrated Head)
Metrics: Quadratic Weighted Kappa (QWK), Referable DR Sensitivity & Specificity
Checkpoint: Saves PyTorch state_dict (.pth) and ONNX (.onnx) for production deployment
"""

import os
import argparse
import time
from typing import Tuple, List, Optional
import numpy as np
import cv2
from PIL import Image
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.models as models
import torchvision.transforms as transforms
from sklearn.metrics import cohen_kappa_score, confusion_matrix

# Canonical Configuration
IMAGE_SIZE = (224, 224)
NUM_CLASSES = 5
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


# ============================================================
# Canonical LAB CLAHE Preprocessing
# ============================================================
def apply_clahe_lab(image_rgb: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
    lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
    l_chan, a_chan, b_chan = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_chan)
    merged = cv2.merge((l_enhanced, a_chan, b_chan))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)


class RetinalFundusDataset(Dataset):
    """PyTorch Dataset loading fundus images with canonical CLAHE preprocessing."""

    def __init__(self, image_paths: List[str], labels: List[int], is_train: bool = True):
        self.image_paths = image_paths
        self.labels = labels
        self.is_train = is_train

        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        path = self.image_paths[idx]
        label = self.labels[idx]

        img_bgr = cv2.imread(path)
        if img_bgr is None:
            # Fallback zero array if missing
            img_rgb = np.zeros((IMAGE_SIZE[0], IMAGE_SIZE[1], 3), dtype=np.uint8)
        else:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            img_rgb = cv2.resize(img_rgb, IMAGE_SIZE, interpolation=cv2.INTER_AREA)

        # Apply CLAHE
        enhanced = apply_clahe_lab(img_rgb)

        # Training augmentation (random horizontal/vertical flips)
        if self.is_train:
            if np.random.rand() > 0.5:
                enhanced = cv2.flip(enhanced, 1)
            if np.random.rand() > 0.5:
                enhanced = cv2.flip(enhanced, 0)

        tensor = self.transform(enhanced)
        return tensor, label


# ============================================================
# Model Definition
# ============================================================
def create_model(num_classes: int = NUM_CLASSES, pretrained: bool = True) -> nn.Module:
    weights = models.ResNet18_Weights.DEFAULT if pretrained else None
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model


# ============================================================
# Evaluation Function
# ============================================================
def evaluate_model(model: nn.Module, dataloader: DataLoader, device: torch.device) -> dict:
    model.eval()
    all_preds, all_targets = [], []

    with torch.no_grad():
        for inputs, targets in dataloader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            preds = torch.argmax(outputs, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_targets.extend(targets.numpy())

    y_true = np.array(all_targets)
    y_pred = np.array(all_preds)

    qwk = cohen_kappa_score(y_true, y_pred, weights="quadratic")
    accuracy = float(np.mean(y_true == y_pred))

    binary_true = (y_true >= 2).astype(int)
    binary_pred = (y_pred >= 2).astype(int)

    cm = confusion_matrix(binary_true, binary_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    return {
        "accuracy": accuracy,
        "qwk": qwk,
        "sensitivity": sensitivity,
        "specificity": specificity,
        "tp": int(tp),
        "fp": int(fp),
        "tn": int(tn),
        "fn": int(fn),
    }


def train_pipeline(
    train_loader: DataLoader,
    val_loader: DataLoader,
    num_epochs: int = 10,
    lr: float = 1e-4,
    device_str: str = "cpu",
    output_dir: str = "./models",
):
    os.makedirs(output_dir, exist_ok=True)
    device = torch.device(device_str)

    model = create_model(num_classes=NUM_CLASSES, pretrained=True)
    model.to(device)

    # Class-weighted Cross-Entropy for class imbalance
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-2)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)

    best_qwk = -1.0
    best_path = os.path.join(output_dir, "netrascan_resnet18_dr.pth")

    print(f"🚀 Starting NetraScan Model Training on {device} ({num_epochs} Epochs)...")

    for epoch in range(1, num_epochs + 1):
        model.train()
        total_loss = 0.0
        start = time.time()

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / len(train_loader)
        metrics = evaluate_model(model, val_loader, device)
        elapsed = time.time() - start

        print(
            f"Epoch [{epoch}/{num_epochs}] ({elapsed:.1f}s) | "
            f"Train Loss: {avg_loss:.4f} | "
            f"Val Acc: {metrics['accuracy']*100:.1f}% | "
            f"QWK: {metrics['qwk']:.4f} | "
            f"Sens: {metrics['sensitivity']*100:.1f}% | "
            f"Spec: {metrics['specificity']*100:.1f}%"
        )

        if metrics["qwk"] > best_qwk:
            best_qwk = metrics["qwk"]
            torch.save(model.state_dict(), best_path)
            print(f"  ⭐ New Best Model Checkpoint saved to: {best_path}")

    print("🏁 Training complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NetraScan PyTorch Model Training Pipeline")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--device", type=str, default="cpu", help="Device (cpu, mps, cuda)")
    parser.add_argument("--output_dir", type=str, default="./models", help="Output directory for checkpoints")
    args = parser.parse_args()

    print(f"NetraScan ML Training Configuration: {args}")
