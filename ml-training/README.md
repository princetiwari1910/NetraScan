# NetraScan — ML Training & Explainability

## Overview

NetraScan uses computer vision and deep learning to analyze retinal fundus images and assist in the preliminary identification and grading of visible diabetic retinopathy abnormalities.

The ML pipeline is designed to:

1. Preprocess input fundus images
2. Enhance and normalize retinal images
3. Classify images using a trained ResNet-18 deep learning model
4. Predict diabetic retinopathy severity from Grade 0 to Grade 4
5. Calculate class probabilities and confidence
6. Evaluate model performance
7. Generate explainable AI visualizations using Grad-CAM
8. Export the trained model to ONNX for backend integration

> ⚠️ NetraScan is an assistive screening system and is not intended to replace professional medical diagnosis.

---

## ML Pipeline

```text
Input Fundus Image
        ↓
Image Preprocessing
        ↓
Image Enhancement / Normalization
        ↓
ResNet-18 Model
        ↓
5-Class Classification
        ↓
Grade 0–4 Prediction
        ↓
Confidence + Class Probabilities
        ↓
Referable DR Assessment
        ↓
Grad-CAM Explainability
        ↓
Result + Visualization
