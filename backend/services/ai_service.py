import io
import os
import base64
import json
import subprocess
import tempfile
from typing import Dict, List

import cv2
import numpy as np
from PIL import Image

from schemas import AnalysisSuccessResponse, QualityMetric


# ============================================================
# ICDR LABELS
# ============================================================

ICDR_STAGE_NAMES: Dict[int, str] = {
    0: "No Diabetic Retinopathy",
    1: "Mild Non-Proliferative Diabetic Retinopathy",
    2: "Moderate Non-Proliferative Diabetic Retinopathy",
    3: "Severe Non-Proliferative Diabetic Retinopathy",
    4: "Proliferative Diabetic Retinopathy"
}


ICDR_EVIDENCE_MAP: Dict[int, List[str]] = {
    0: [
        "No significant diabetic retinopathy features detected by the AI model.",
        "AI screening result indicates low likelihood of referable diabetic retinopathy."
    ],
    1: [
        "AI model predicts mild non-proliferative diabetic retinopathy.",
        "Routine ophthalmological follow-up is recommended."
    ],
    2: [
        "AI model predicts moderate non-proliferative diabetic retinopathy.",
        "Ophthalmological evaluation is recommended."
    ],
    3: [
        "AI model predicts severe non-proliferative diabetic retinopathy.",
        "Prompt ophthalmological evaluation is recommended."
    ],
    4: [
        "AI model predicts proliferative diabetic retinopathy.",
        "Urgent ophthalmological evaluation is recommended."
    ]
}


# ============================================================
# CONFIGURATION
# ============================================================

IMAGE_SIZE = (224, 224)

# Your selected binary referral threshold
REFERABLE_THRESHOLD = float(
    os.getenv("REFERABLE_THRESHOLD", "0.35")
)

# MATLAB executable.
# Change this if MATLAB is installed somewhere else.
MATLAB_COMMAND = os.getenv("MATLAB_COMMAND", "matlab")

# Folder containing:
#
# netTransfer.mat
# NetraScan_Explainability.m
#
MATLAB_MODEL_DIR = os.getenv(
    "MATLAB_MODEL_DIR",
    "./matlab_model"
)


# ============================================================
# AI SERVICE
# ============================================================

class AIService:

    def __init__(self):

        self.device = "MATLAB"

        self.model_path = os.path.join(
            MATLAB_MODEL_DIR,
            "netTransfer.mat"
        )

        self.matlab_script = os.path.join(
            MATLAB_MODEL_DIR,
            "NetraScan_Explainability.m"
        )

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"MATLAB model not found: {self.model_path}"
            )

        if not os.path.exists(self.matlab_script):
            raise FileNotFoundError(
                f"MATLAB explainability script not found: "
                f"{self.matlab_script}"
            )

        print("🚀 NetraScan initialized with MATLAB ResNet-18.")
        print(f"Model: {self.model_path}")


    # ========================================================
    # IMAGE QUALITY
    # ========================================================

    def _quality_check(
        self,
        file_path: str
    ) -> QualityMetric:

        img = cv2.imread(file_path)

        if img is None:
            raise ValueError(
                f"Could not load image: {file_path}"
            )

        gray = cv2.cvtColor(
            img,
            cv2.COLOR_BGR2GRAY
        )

        lap_var = float(
            cv2.Laplacian(
                gray,
                cv2.CV_64F
            ).var()
        )

        threshold = float(
            os.getenv(
                "BLUR_THRESHOLD",
                "100.0"
            )
        )

        is_blurry = lap_var < threshold

        return QualityMetric(
            laplacian_variance=round(
                lap_var,
                2
            ),
            is_blurry=is_blurry,
            threshold=threshold,
            status=(
                "Warning: Potential Blur"
                if is_blurry
                else "Pass"
            )
        )


    # ========================================================
    # MATLAB INFERENCE
    # ========================================================

    def _run_matlab(
        self,
        image_path: str
    ) -> dict:

        """
        Runs the MATLAB inference wrapper.

        MATLAB must produce a JSON file containing:

        {
            "dr_grade": 0,
            "confidence": 0.97,
            "referable_probability": 0.01,
            "class_probabilities": {
                "0": 0.97,
                "1": 0.02,
                "2": 0.01,
                "3": 0.00,
                "4": 0.00
            },
            "gradcam_image": "..."
        }
        """

        os.makedirs(
            MATLAB_MODEL_DIR,
            exist_ok=True
        )

        result_file = tempfile.NamedTemporaryFile(
            suffix=".json",
            delete=False
        )

        result_file.close()

        result_path = result_file.name

        matlab_command = (
            "cd('" +
            MATLAB_MODEL_DIR.replace("'", "''") +
            "'); " +

            "NetraScan_BackendInference('" +
            image_path.replace("'", "''") +
            "','" +
            result_path.replace("'", "''") +
            "');"
        )

        command = [
            MATLAB_COMMAND,
            "-batch",
            matlab_command
        ]

        try:

            process = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=60
            )

            if process.returncode != 0:

                raise RuntimeError(
                    "MATLAB inference failed:\n" +
                    process.stderr
                )

            if not os.path.exists(result_path):

                raise RuntimeError(
                    "MATLAB completed but did not "
                    "create the result JSON file."
                )

            with open(
                result_path,
                "r",
                encoding="utf-8"
            ) as f:

                result = json.load(f)

            return result

        finally:

            if os.path.exists(result_path):

                os.remove(result_path)


    # ========================================================
    # MAIN ANALYSIS FUNCTION
    # ========================================================

    def analyze_fundus(
        self,
        file_path: str,
        filename: str = ""
    ) -> AnalysisSuccessResponse:

        # -----------------------------------------------
        # Quality check
        # -----------------------------------------------

        quality_metric = self._quality_check(
            file_path
        )

        # -----------------------------------------------
        # MATLAB model
        # -----------------------------------------------

        result = self._run_matlab(
            file_path
        )

        predicted_grade = int(
            result["dr_grade"]
        )

        confidence = float(
            result["confidence"]
        )

        referable_probability = float(
            result.get(
                "referable_probability",
                0.0
            )
        )

        # -----------------------------------------------
        # Referable decision
        # -----------------------------------------------

        referable = (
            referable_probability
            >= REFERABLE_THRESHOLD
        )

        # -----------------------------------------------
        # Class probabilities
        # -----------------------------------------------

        class_probabilities = {
            str(k): float(v)
            for k, v in result.get(
                "class_probabilities",
                {}
            ).items()
        }

        # -----------------------------------------------
        # Grad-CAM
        # -----------------------------------------------

        gradcam_image = result.get(
            "gradcam_image",
            ""
        )

        # -----------------------------------------------
        # Evidence
        # -----------------------------------------------

        evidence = ICDR_EVIDENCE_MAP.get(
            predicted_grade,
            ["Analysis completed."]
        )

        # -----------------------------------------------
        # Final API response
        # -----------------------------------------------

        return AnalysisSuccessResponse(

            status="success",

            dr_grade=predicted_grade,

            severity_label=ICDR_STAGE_NAMES[
                predicted_grade
            ],

            referable=referable,

            confidence=round(
                confidence,
                4
            ),

            class_probabilities=
                class_probabilities,

            gradcam_image=
                gradcam_image,

            evidence=evidence,

            quality_metric=
                quality_metric
        )


# ============================================================
# MOCK SERVICE
# ============================================================

class MockAIService:

    def __init__(self):

        self.device = "cpu"

        print(
            "🚀 NetraScan initialized "
            "in MOCK AI mode."
        )

    def analyze_fundus(
        self,
        file_path: str,
        filename: str = ""
    ) -> AnalysisSuccessResponse:

        quality_metric = QualityMetric(
            laplacian_variance=150.0,
            is_blurry=False,
            threshold=100.0,
            status="Pass"
        )

        return AnalysisSuccessResponse(

            status="success",

            dr_grade=0,

            severity_label=
                ICDR_STAGE_NAMES[0],

            referable=False,

            confidence=0.95,

            class_probabilities={
                "0": 0.95,
                "1": 0.02,
                "2": 0.01,
                "3": 0.01,
                "4": 0.01
            },

            gradcam_image="",

            evidence=
                ICDR_EVIDENCE_MAP[0],

            quality_metric=
                quality_metric
        )
