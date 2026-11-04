from ultralytics import YOLO
from typing import List, Dict, Tuple
import numpy as np
from PIL import Image
import io

# RDD2022 damage classes
DAMAGE_CLASSES = {
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole"
}


class DetectionService:
    def __init__(self, model_path: str = None):
        """
        Initialize YOLOv8 model for road damage detection.
        If model_path is not provided, will download/use default weights.
        """
        self.model = YOLO(model_path or "yolov8n.pt")  # Use smallest by default for speed
        self.class_mapping = DAMAGE_CLASSES

    def detect_damage(self, image: Image.Image, confidence_threshold: float = 0.25) -> List[Dict]:
        """
        Detect road damage in an image.

        Args:
            image: PIL Image object
            confidence_threshold: Minimum confidence for detection

        Returns:
            List of detection results with class, confidence, and bbox
        """
        results = self.model(image, conf=confidence_threshold, verbose=False)

        detections = []
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]

                # Map class ID to damage type
                # Note: Actual class IDs depend on training - this is a placeholder
                damage_type = list(self.class_mapping.keys())[cls_id % len(self.class_mapping)]

                detections.append({
                    "damage_type": damage_type,
                    "damage_name": self.class_mapping.get(damage_type, "Unknown"),
                    "confidence": conf,
                    "bbox": bbox
                })

        return detections

    def get_primary_damage(self, image: Image.Image) -> Tuple[str, float]:
        """
        Get the primary (highest confidence) damage type from an image.

        Returns:
            Tuple of (damage_type, confidence)
        """
        detections = self.detect_damage(image)
        if not detections:
            return None, 0.0

        # Return detection with highest confidence
        primary = max(detections, key=lambda x: x["confidence"])
        return primary["damage_type"], primary["confidence"]

    def estimate_severity(self, image: Image.Image, damage_type: str) -> int:
        """
        Estimate severity (1-5) based on detection characteristics.
        Note: This is a simplified heuristic. A real implementation would use
        a separate severity classifier or regression model.

        Args:
            image: PIL Image
            damage_type: Type of damage detected

        Returns:
            Severity score 1-5
        """
        detections = self.detect_damage(image)
        if not detections:
            return 1

        # Heuristic: larger bbox = more severe
        img_width, img_height = image.size
        img_area = img_width * img_height

        primary = max(detections, key=lambda x: x["confidence"])
        bbox = primary["bbox"]
        bbox_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        area_ratio = bbox_area / img_area

        # Simple severity mapping based on damage size
        if area_ratio < 0.01:
            return 1
        elif area_ratio < 0.05:
            return 2
        elif area_ratio < 0.15:
            return 3
        elif area_ratio < 0.30:
            return 4
        else:
            return 5


# Singleton instance
detection_service = DetectionService()
