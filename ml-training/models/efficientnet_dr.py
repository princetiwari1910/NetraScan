import torch
import torch.nn as nn
from torchvision import models

class EfficientNetB4DR(nn.Module):
    """
    EfficientNet-B4 architecture fine-tuned for 5-Class ICDR Diabetic Retinopathy grading.
    """
    def __init__(self, num_classes: int = 5, pretrained: bool = True, dropout_rate: float = 0.3):
        super(EfficientNetB4DR, self).__init__()
        weights = models.EfficientNet_B4_Weights.DEFAULT if pretrained else None
        self.backbone = models.efficientnet_b4(weights=weights)
        
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate, inplace=True),
            nn.Linear(in_features, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)
