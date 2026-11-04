import httpx
from typing import List, Dict, Optional, Tuple
from app.core.config import settings


class RoutingService:
    """
    OSRM-based routing service with risk-aware route comparison.
    """

    def __init__(self):
        self.osrm_url = settings.OSRM_BASE_URL
        self.detour_threshold = settings.DETOUR_THRESHOLD_RATIO

    async def get_route(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        profile: str = "driving"
    ) -> Dict:
        """
        Get route from OSRM.

        Returns:
            Route data with geometry, distance, duration
        """
        url = f"{self.osrm_url}/route/v1/{profile}/{start_lon},{start_lat};{end_lon},{end_lat}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params={"overview": "full"})
            response.raise_for_status()
            data = response.json()

        if data.get("code") != "Ok":
            raise Exception(f"OSRM error: {data.get('message')}")

        route = data["routes"][0]
        return {
            "geometry": route["geometry"],
            "distance": route["distance"],  # meters
            "duration": route["duration"],  # seconds
            "legs": route["legs"]
        }

    async def get_alternative_routes(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        num_alternatives: int = 2
    ) -> List[Dict]:
        """
        Get multiple route alternatives from OSRM.

        Returns:
            List of route data
        """
        url = f"{self.osrm_url}/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={
                    "overview": "full",
                    "alternatives": "true",
                    "number": num_alternatives + 1
                }
            )
            response.raise_for_status()
            data = response.json()

        if data.get("code") != "Ok":
            raise Exception(f"OSRM error: {data.get('message')}")

        routes = []
        for route in data["routes"]:
            routes.append({
                "geometry": route["geometry"],
                "distance": route["distance"],
                "duration": route["duration"],
                "legs": route["legs"]
            })

        return routes

    def decode_geometry(self, encoded: str) -> List[Tuple[float, float]]:
        """
        Decode OSRM polyline geometry.

        Returns:
            List of (lat, lon) tuples
        """
        # Simple polyline decoder (OSRM uses Google's polyline encoding)
        # This is a simplified version - use polyline library in production
        import polyline
        return polyline.decode(encoded)

    def calculate_route_risk(
        self,
        route_geometry: str,
        risk_callback
    ) -> float:
        """
        Calculate average risk along a route by sampling points.

        Args:
            route_geometry: Encoded polyline
            risk_callback: Function that takes (lat, lon) and returns risk score

        Returns:
            Average risk score (0-1)
        """
        points = self.decode_geometry(route_geometry)

        # Sample points every ~100m (simplified)
        sample_interval = max(1, len(points) // 50)  # Sample ~50 points max
        sampled_points = points[::sample_interval]

        total_risk = 0.0
        for lat, lon in sampled_points:
            risk = risk_callback(lat, lon)
            total_risk += risk

        return total_risk / len(sampled_points) if sampled_points else 0.0

    async def compare_route_safety(
        self,
        start_lat: float,
        start_lon: float,
        end_lat: float,
        end_lon: float,
        risk_callback
    ) -> Dict:
        """
        Compare route alternatives by safety.

        Returns:
            Dictionary with safest route, risk scores, and recommendations
        """
        routes = await self.get_alternative_routes(
            start_lat, start_lon, end_lat, end_lon, num_alternatives=2
        )

        route_risks = []
        for i, route in enumerate(routes):
            avg_risk = self.calculate_route_risk(route["geometry"], risk_callback)
            route_risks.append({
                "index": i,
                "distance": route["distance"],
                "duration": route["duration"],
                "risk_score": avg_risk,
                "geometry": route["geometry"]
            })

        # Sort by risk (lower is safer)
        route_risks.sort(key=lambda x: x["risk_score"])

        safest = route_risks[0]
        fastest = min(route_risks, key=lambda x: x["duration"])

        # Check if safest route is reasonable detour
        detour_ratio = safest["duration"] / fastest["duration"]
        is_reasonable = detour_ratio <= self.detour_threshold

        return {
            "safest_route": safest,
            "fastest_route": fastest,
            "all_routes": route_risks,
            "detour_ratio": detour_ratio,
            "recommendation": "safest" if is_reasonable else "fastest",
            "message": (
                f"Safest route adds {((detour_ratio - 1) * 100):.1f}% time "
                f"but reduces risk by {((fastest['risk_score'] - safest['risk_score']) * 100):.1f}%"
            )
        }


routing_service = RoutingService()
