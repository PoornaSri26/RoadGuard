from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.routing import routing_service
from app.services.risk import risk_service
from pydantic import BaseModel

router = APIRouter(prefix="/routing", tags=["routing"])


class RouteRequest(BaseModel):
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float


@router.post("/compare")
async def compare_routes(
    request: RouteRequest,
    db: Session = Depends(get_db)
):
    """
    Compare route alternatives by safety.
    Returns the safest route with risk analysis.
    """
    # Risk callback for routing service
    def risk_callback(lat: float, lon: float) -> float:
        return risk_service.calculate_segment_risk(db, lat, lon, radius_meters=100)

    result = await routing_service.compare_route_safety(
        request.start_lat,
        request.start_lon,
        request.end_lat,
        request.end_lon,
        risk_callback
    )

    return result


@router.post("/route")
async def get_route(request: RouteRequest):
    """
    Get a single route from OSRM (standard routing).
    """
    route = await routing_service.get_route(
        request.start_lat,
        request.start_lon,
        request.end_lat,
        request.end_lon
    )
    return route
