import numpy as np
from sklearn.metrics import cohen_kappa_score, confusion_matrix, classification_report

def calculate_clinical_metrics(y_true: np.ndarray, y_pred: np.ndarray):
    """
    Computes clinically critical metrics for Diabetic Retinopathy screening:
    - Quadratic Weighted Kappa (QWK) across 5 ICDR grades
    - Sensitivity & Specificity for Referable DR (Grade >= 2)
    """
    # 1. Quadratic Weighted Kappa
    qwk = cohen_kappa_score(y_true, y_pred, weights="quadratic")

    # 2. Binary referable classification (Grade >= 2)
    binary_true = (y_true >= 2).astype(int)
    binary_pred = (y_pred >= 2).astype(int)

    tn, fp, fn, tp = confusion_matrix(binary_true, binary_pred).ravel()
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

    print("=" * 50)
    print("🏥 NETRASCAN CLINICAL VALIDATION REPORT")
    print("=" * 50)
    print(f"Quadratic Weighted Kappa (QWK): {qwk:.4f}")
    print(f"Referable DR Sensitivity:       {sensitivity * 100:.2f}% (Target: >90%)")
    print(f"Referable DR Specificity:       {specificity * 100:.2f}% (Target: >85%)")
    print("-" * 50)
    print(f"True Positives: {tp} | False Positives: {fp}")
    print(f"True Negatives: {tn} | False Negatives: {fn}")
    print("=" * 50)

    return {
        "qwk": qwk,
        "sensitivity": sensitivity,
        "specificity": specificity,
        "confusion_matrix": {"tp": tp, "fp": fp, "tn": tn, "fn": fn}
    }

if __name__ == "__main__":
    # Test sample with synthetic ground truth and predictions
    np.random.seed(42)
    sample_true = np.random.choice([0, 1, 2, 3, 4], size=100, p=[0.5, 0.2, 0.15, 0.1, 0.05])
    sample_pred = np.clip(sample_true + np.random.choice([-1, 0, 1], size=100, p=[0.1, 0.8, 0.1]), 0, 4)
    calculate_clinical_metrics(sample_true, sample_pred)
