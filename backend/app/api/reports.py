from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.report import Report, Vote
from app.services.detection import detection_service
from app.services.risk import risk_service
from pydantic import BaseModel
import base64
from io import BytesIO
from PIL import Image

router = APIRouter(prefix="/reports", tags=["reports"])


class ReportCreate(BaseModel):
    latitude: float
    longitude: float
    damage_type: Optional[str] = None  # If not provided, AI will detect
    severity: Optional[int] = None  # If not provided, AI will estimate
    image_data: Optional[str] = None  # Base64 encoded image


class ReportResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    damage_type: str
    severity: int
    image_url: Optional[str]
    verified: bool
    verification_count: int
    created_at: datetime
    risk_score: Optional[float] = None

    class Config:
        from_attributes = True


class VoteCreate(BaseModel):
    report_id: int
    vote_type: str  # "upvote" or "downvote"
    user_ip: str


@router.post("/", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    user_ip: str = "127.0.0.1"
):
    """
    Create a new damage report.
    If image_data is provided, AI will detect damage type and estimate severity.
    """
    damage_type = report.damage_type
    severity = report.severity
    ai_overridden = False

    # Run AI detection if image provided and damage_type not specified
    if report.image_data and not damage_type:
        try:
            # Decode base64 image
            image_data = base64.b64decode(report.image_data.split(",")[1])
            image = Image.open(BytesIO(image_data))

            # Detect damage
            detected_type, confidence = detection_service.get_primary_damage(image)
            if detected_type:
                damage_type = detected_type
                # Estimate severity
                severity = detection_service.estimate_severity(image, damage_type)
            else:
                damage_type = "D40"  # Default to pothole
                severity = 3
        except Exception as e:
            # Fallback if detection fails
            damage_type = "D40"
            severity = 3

    # If user provided severity but AI detected different, mark as overridden
    if report.severity and report.image_data:
        ai_overridden = True
        severity = report.severity

    # Validate severity
    if not severity or severity < 1 or severity > 5:
        severity = 3

    db_report = Report(
        latitude=report.latitude,
        longitude=report.longitude,
        damage_type=damage_type or "D40",
        severity=severity,
        user_ip=user_ip,
        ai_overridden=ai_overridden
    )

    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Calculate risk score
    risk_score = risk_service.calculate_report_risk(db_report)

    return ReportResponse(
        id=db_report.id,
        latitude=db_report.latitude,
        longitude=db_report.longitude,
        damage_type=db_report.damage_type,
        severity=db_report.severity,
        image_url=db_report.image_url,
        verified=db_report.verified,
        verification_count=db_report.verification_count,
        created_at=db_report.created_at,
        risk_score=risk_score
    )


@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius: float = 1000,  # meters
    db: Session = Depends(get_db)
):
    """
    List reports, optionally filtered by location.
    """
    query = db.query(Report)

    if lat is not None and lon is not None:
        # Approximate bounding box
        import math
        lat_delta = radius / 111000
        lon_delta = radius / (111000 * math.cos(math.radians(lat)))

        query = query.filter(
            Report.latitude >= lat - lat_delta,
            Report.latitude <= lat + lat_delta,
            Report.longitude >= lon - lon_delta,
            Report.longitude <= lon + lon_delta
        )

    reports = query.order_by(Report.created_at.desc()).limit(100).all()

    # Add risk scores
    result = []
    for report in reports:
        risk_score = risk_service.calculate_report_risk(report)
        result.append(ReportResponse(
            id=report.id,
            latitude=report.latitude,
            longitude=report.longitude,
            damage_type=report.damage_type,
            severity=report.severity,
            image_url=report.image_url,
            verified=report.verified,
            verification_count=report.verification_count,
            created_at=report.created_at,
            risk_score=risk_score
        ))

    return result


@router.post("/{report_id}/vote")
async def vote_report(
    report_id: int,
    vote: VoteCreate,
    db: Session = Depends(get_db)
):
    """
    Vote on a report (upvote/downvote for verification).
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check if user already voted
    existing_vote = db.query(Vote).filter(
        Vote.report_id == report_id,
        Vote.user_ip == vote.user_ip
    ).first()

    if existing_vote:
        raise HTTPException(status_code=400, detail="Already voted")

    # Create vote
    db_vote = Vote(
        report_id=report_id,
        user_ip=vote.user_ip,
        vote_type=vote.vote_type
    )
    db.add(db_vote)

    # Update report verification count
    if vote.vote_type == "upvote":
        report.verification_count += 1

        # Auto-verify if threshold reached
        if report.verification_count >= 3:  # Use settings.VERIFY_THRESHOLD
            report.verified = True

    db.commit()

    return {"message": "Vote recorded", "verified": report.verified}


@router.get("/risk/segment")
async def get_segment_risk(
    lat: float,
    lon: float,
    radius: float = 100,
    db: Session = Depends(get_db)
):
    """
    Get risk score for a road segment at a location.
    """
    risk = risk_service.calculate_segment_risk(db, lat, lon, radius)
    return {"latitude": lat, "longitude": lon, "radius_meters": radius, "risk_score": risk}
