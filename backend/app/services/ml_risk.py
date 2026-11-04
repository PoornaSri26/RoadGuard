import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import math

class MLRiskScoringService:
    """
    ML-based risk scoring with calibration and ensemble methods.
    Uses RandomForest for classification (high/medium/low risk) and
    GradientBoosting for regression (continuous risk score).
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.risk_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.risk_regressor = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        self.is_trained = False
        self.feature_names = [
            'severity', 'age_hours', 'verification_count', 'verified',
            'proximity_score', 'damage_type_encoded', 'density_nearby'
        ]

    def extract_features(self, report, proximity_score: float = 1.0, nearby_count: int = 0) -> np.ndarray:
        """Extract features from a report for ML model"""
        age_hours = (datetime.utcnow() - report.created_at).total_seconds() / 3600

        # Encode damage type
        damage_encoding = {
            'D00': 0,  # Longitudinal crack
            'D10': 1,  # Transverse crack
            'D20': 2,  # Alligator crack
            'D40': 3   # Pothole (most severe)
        }.get(report.damage_type, 2)

        features = np.array([
            report.severity / 5.0,  # Normalized severity
            age_hours / 168.0,  # Normalized age (1 week)
            min(report.verification_count, 10) / 10.0,  # Normalized votes
            1.0 if report.verified else 0.0,
            proximity_score,
            damage_encoding / 3.0,  # Normalized damage type
            min(nearby_count, 20) / 20.0  # Normalized nearby reports
        ])

        return features.reshape(1, -1)

    def train(self, training_data: List[Tuple[Dict, float]]):
        """
        Train the ML models with historical data.

        Args:
            training_data: List of (features_dict, actual_risk_score) tuples
        """
        if len(training_data) < 10:
            print("Not enough training data, using default weights")
            return

        X = []
        y_class = []  # 0=low, 1=medium, 2=high
        y_reg = []

        for features_dict, actual_risk in training_data:
            features = np.array([
                features_dict['severity'],
                features_dict['age_hours'],
                features_dict['verification_count'],
                features_dict['verified'],
                features_dict['proximity_score'],
                features_dict['damage_type_encoded'],
                features_dict['density_nearby']
            ]).reshape(1, -1)

            X.append(features[0])

            # Classification: risk > 0.7 = high, > 0.4 = medium, else low
            if actual_risk > 0.7:
                y_class.append(2)
            elif actual_risk > 0.4:
                y_class.append(1)
            else:
                y_class.append(0)

            y_reg.append(actual_risk)

        X = np.array(X)
        y_class = np.array(y_class)
        y_reg = np.array(y_reg)

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Train models
        self.risk_classifier.fit(X_scaled, y_class)
        self.risk_regressor.fit(X_scaled, y_reg)

        self.is_trained = True
        print(f"ML models trained on {len(training_data)} samples")

    def predict_risk(self, report, proximity_score: float = 1.0, nearby_count: int = 0) -> Dict:
        """
        Predict risk score using ML models.

        Returns:
            Dict with risk_score, confidence, and risk_category
        """
        features = self.extract_features(report, proximity_score, nearby_count)

        if not self.is_trained:
            # Fallback to heuristic if not trained
            return self._heuristic_risk(report, proximity_score)

        # Scale features
        features_scaled = self.scaler.transform(features)

        # Predict risk class
        risk_class = self.risk_classifier.predict(features_scaled)[0]
        class_proba = self.risk_classifier.predict_proba(features_scaled)[0]
        confidence = max(class_proba)

        # Predict continuous risk score
        risk_score = self.risk_regressor.predict(features_scaled)[0]
        risk_score = max(0.0, min(1.0, risk_score))  # Clamp to [0, 1]

        risk_category = ['low', 'medium', 'high'][risk_class]

        return {
            'risk_score': risk_score,
            'confidence': confidence,
            'risk_category': risk_category,
            'method': 'ml'
        }

    def _heuristic_risk(self, report, proximity_score: float) -> Dict:
        """Fallback heuristic risk calculation"""
        from app.services.risk import risk_service
        risk_score = risk_service.calculate_report_risk(report)
        risk_score = risk_score * proximity_score

        if risk_score > 0.7:
            category = 'high'
        elif risk_score > 0.4:
            category = 'medium'
        else:
            category = 'low'

        return {
            'risk_score': risk_score,
            'confidence': 0.5,
            'risk_category': category,
            'method': 'heuristic'
        }

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if not self.is_trained:
            return {}

        importance = self.risk_classifier.feature_importances_
        return dict(zip(self.feature_names, importance))


ml_risk_service = MLRiskScoringService()
