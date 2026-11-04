from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.report import Report
from app.core.config import settings
import math


class RiskScoringService:
    """
    Calculates risk scores for road segments based on reports.
    Formula: severity × recency × verification × proximity
    """

    def __init__(self):
        self.severity_weight = settings.RISK_WEIGHT_SEVERITY
        self.recency_weight = settings.RISK_WEIGHT_RECENCY
        self.verification_weight = settings.RISK_WEIGHT_VERIFICATION
        self.proximity_weight = settings.RISK_WEIGHT_PROXIMITY
        self.half_life_hours = settings.REPORT_HALF_LIFE_HOURS

    def calculate_report_risk(self, report: Report) -> float:
        """
        Calculate risk score for a single report.

        Returns:
            Risk score between 0 and 1
        """
        # Severity factor (1-5 normalized to 0-1)
        severity_factor = report.severity / 5.0

        # Recency factor (exponential decay based on half-life)
        hours_old = (datetime.utcnow() - report.created_at).total_seconds() / 3600
        recency_factor = math.pow(0.5, hours_old / self.half_life_hours)

        # Verification factor (based on vote count)
        # Normalize: 0 votes = 0.5, 10+ votes = 1.0
        verification_factor = 0.5 + min(report.verification_count, 10) / 20.0
        if report.verified:
            verification_factor = min(verification_factor + 0.3, 1.0)

        # Proximity factor is calculated when querying nearby reports
        # For single report, we use 1.0 (will be adjusted in aggregate)
        proximity_factor = 1.0

        # Weighted combination
        risk = (
            severity_factor * self.severity_weight +
            recency_factor * self.recency_weight +
            verification_factor * self.verification_weight +
            proximity_factor * self.proximity_weight
        )

        return min(risk, 1.0)

    def calculate_segment_risk(
        self,
        db: Session,
        lat: float,
        lon: float,
        radius_meters: float = 100
    ) -> float:
        """
        Calculate aggregate risk for a road segment at a location.

        Args:
            db: Database session
            lat: Latitude of point
            lon: Longitude of point
            radius_meters: Search radius in meters

        Returns:
            Aggregate risk score between 0 and 1
        """
        # Get nearby reports (simplified - in production use spatial index)
        # Approximate bounding box (1 degree ≈ 111km)
        lat_delta = radius_meters / 111000
        lon_delta = radius_meters / (111000 * math.cos(math.radians(lat)))

        nearby_reports = db.query(Report).filter(
            Report.latitude >= lat - lat_delta,
            Report.latitude <= lat + lat_delta,
            Report.longitude >= lon - lon_delta,
            Report.longitude <= lon + lon_delta
        ).all()

        if not nearby_reports:
            return 0.0

        # Calculate risk for each report with proximity weighting
        total_risk = 0.0
        total_weight = 0.0

        for report in nearby_reports:
            # Calculate distance
            distance = self._haversine_distance(lat, lon, report.latitude, report.longitude)

            if distance > radius_meters:
                continue

            # Proximity factor: closer = higher (inverse distance)
            proximity_factor = 1.0 - (distance / radius_meters)

            report_risk = self.calculate_report_risk(report)
            # Override proximity in report_risk with actual proximity
            adjusted_risk = (
                (report.severity / 5.0) * self.severity_weight +
                report_risk * (self.recency_weight + self.verification_weight) +
                proximity_factor * self.proximity_weight
            )

            total_risk += adjusted_risk
            total_weight += 1.0

        if total_weight == 0:
            return 0.0

        return min(total_risk / total_weight, 1.0)

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate Haversine distance between two points in meters.
        """
        R = 6371000  # Earth radius in meters

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        a = (
            math.sin(delta_lat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c


risk_service = RiskScoringService()
