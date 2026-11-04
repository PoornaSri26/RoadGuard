from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio

router = APIRouter(prefix="/ws", tags=["websocket"])


class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def send_personal(self, message: dict, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)


manager = ConnectionManager()


@router.websocket("/reports")
async def websocket_reports(websocket: WebSocket):
    """WebSocket endpoint for real-time report updates"""
    await manager.connect(websocket)

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to RoadGuardian real-time updates"
        })

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Echo back or handle client messages
            await websocket.send_json({
                "type": "echo",
                "data": data
            })

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def notify_new_report(report_data: dict):
    """Notify all clients about a new report"""
    await manager.broadcast({
        "type": "new_report",
        "data": report_data
    })


async def notify_report_update(report_id: int, update_data: dict):
    """Notify all clients about a report update (vote, verification)"""
    await manager.broadcast({
        "type": "report_update",
        "report_id": report_id,
        "data": update_data
    })
