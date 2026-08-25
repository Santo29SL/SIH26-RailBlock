"""Stage 6: Real-time Event Listener & Telemetry WebSocket Stream."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["Stage 6 — Real-time Telemetry & Events"])


class ConnectionManager:
    """Manages active WebSocket client connections for real-time telemetry."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast event payload to all connected clients."""
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Error sending WebSocket message ({exc}); disconnecting client.")
                self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/ws/telemetry")
async def telemetry_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint streaming live COA train movements, block overruns, and SLW advisories."""
    await manager.connect(websocket)
    try:
        # Send initial connection handshake
        await websocket.send_json(
            {
                "event_type": "HANDSHAKE",
                "status": "connected",
                "message": "Connected to RailBlock Real-time COA Telemetry Stream",
            }
        )

        while True:
            # Echo or process incoming client commands
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                cmd = payload.get("command")

                if cmd == "PING":
                    await websocket.send_json({"event_type": "PONG"})
                elif cmd == "SIMULATE_TRAIN_DELAY":
                    delay_min = payload.get("delay_minutes", 25)
                    train_code = payload.get("train_code", "12951")
                    event = {
                        "event_type": "TRAIN_DELAY_ALERT",
                        "train_code": train_code,
                        "delay_minutes": delay_min,
                        "reschedule_required": delay_min > 20,
                        "action_advised": "Trigger Stage 6 Fast Rescheduler" if delay_min > 20 else "Safety Buffer Absorbed",
                    }
                    await manager.broadcast(event)
                else:
                    await websocket.send_json({"event_type": "ACK", "received": payload})

            except json.JSONDecodeError:
                await websocket.send_json({"event_type": "ERROR", "message": "Invalid JSON format"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
