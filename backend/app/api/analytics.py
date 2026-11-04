from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.report import Report
from app.models.user import User
import pandas as pd

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def get_analytics_overview(db: Session = Depends(get_db)):
    """Get high-level analytics overview"""
    total_reports = db.query(func.count(Report.id)).scalar()
    verified_reports = db.query(func.count(Report.id)).filter(Report.verified == True).scalar()
    total_users = db.query(func.count(User.id)).scalar()

    # Reports in last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_reports = db.query(func.count(Report.id)).filter(
        Report.created_at >= week_ago
    ).scalar()

    # Damage type distribution
    damage_distribution = db.query(
        Report.damage_type,
        func.count(Report.id)
    ).group_by(Report.damage_type).all()

    damage_stats = {
        damage_type: count for damage_type, count in damage_distribution
    }

    # Severity distribution
    severity_distribution = db.query(
        Report.severity,
        func.count(Report.id)
    ).group_by(Report.severity).all()

    severity_stats = {
        str(severity): count for severity, count in severity_distribution
    }

    return {
        "total_reports": total_reports,
        "verified_reports": verified_reports,
        "verification_rate": verified_reports / total_reports if total_reports > 0 else 0,
        "total_users": total_users,
        "recent_reports_7d": recent_reports,
        "damage_distribution": damage_stats,
        "severity_distribution": severity_stats
    }


@router.get("/timeline")
async def get_report_timeline(days: int = 30, db: Session = Depends(get_db)):
    """Get report count over time (timeline)"""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Group by day
    timeline = db.query(
        func.date(Report.created_at).label('date'),
        func.count(Report.id).label('count')
    ).filter(
        Report.created_at >= start_date
    ).group_by(
        func.date(Report.created_at)
    ).order_by(
        func.date(Report.created_at)
    ).all()

    return {
        "timeline": [
            {"date": str(date), "count": count}
            for date, count in timeline
        ]
    }


@router.get("/hotspots")
async def get_risk_hotspots(limit: int = 10, db: Session = Depends(get_db)):
    """Get top risk hotspots (areas with many high-severity reports)"""
    # Group by approximate location (using 0.01 degree grid)
    lat_grid = func.round(Report.latitude, 2)
    lon_grid = func.round(Report.longitude, 2)

    hotspots = db.query(
        lat_grid.label('lat'),
        lon_grid.label('lon'),
        func.count(Report.id).label('report_count'),
        func.avg(Report.severity).label('avg_severity'),
        func.sum(func.case((Report.verified == True, 1), else_=0)).label('verified_count')
    ).group_by(
        lat_grid, lon_grid
    ).having(
        func.count(Report.id) >= 3
    ).order_by(
        desc(func.count(Report.id))
    ).limit(limit).all()

    return {
        "hotspots": [
            {
                "latitude": float(lat),
                "longitude": float(lon),
                "report_count": count,
                "avg_severity": float(avg_severity),
                "verified_count": verified_count
            }
            for lat, lon, count, avg_severity, verified_count in hotspots
        ]
    }


@router.get("/user-activity")
async def get_user_activity(db: Session = Depends(get_db)):
    """Get top users by report count"""
    top_users = db.query(
        User.username,
        func.count(Report.id).label('report_count')
    ).join(
        Report, User.id == Report.user_id
    ).group_by(
        User.id, User.username
    ).order_by(
        desc(func.count(Report.id))
    ).limit(10).all()

    return {
        "top_users": [
            {"username": username, "report_count": count}
            for username, count in top_users
        ]
    }


@router.get("/risk-trends")
async def get_risk_trends(days: int = 30, db: Session = Depends(get_db)):
    """Get risk score trends over time"""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Average severity over time
    severity_trend = db.query(
        func.date(Report.created_at).label('date'),
        func.avg(Report.severity).label('avg_severity')
    ).filter(
        Report.created_at >= start_date
    ).group_by(
        func.date(Report.created_at)
    ).order_by(
        func.date(Report.created_at)
    ).all()

    # Verification rate over time
    verification_trend = db.query(
        func.date(Report.created_at).label('date'),
        (func.sum(func.case((Report.verified == True, 1), else_=0)).cast(float) /
         func.count(Report.id)).label('verification_rate')
    ).filter(
        Report.created_at >= start_date
    ).group_by(
        func.date(Report.created_at)
    ).order_by(
        func.date(Report.created_at)
    ).all()

    return {
        "severity_trend": [
            {"date": str(date), "avg_severity": float(avg_severity)}
            for date, avg_severity in severity_trend
        ],
        "verification_trend": [
            {"date": str(date), "verification_rate": float(rate) if rate else 0}
            for date, rate in verification_trend
        ]
    }
