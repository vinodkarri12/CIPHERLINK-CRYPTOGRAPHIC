import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket

logger = logging.getLogger("cipherlink.networking")

class ConnectionManager:
    """
    Manages WebSocket rooms and client signaling for secure peer-to-peer file transfer.
    Rooms allow a Sender and a Receiver to discover each other, authenticate ECDH public keys,
    and relay encrypted file chunks with byte-level verification.
    """
    def __init__(self):
        # room_code -> Dict of client_id -> WebSocket
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}
        # room_code -> Dict of client_id -> client metadata (role, public_key, etc.)
        self.room_clients: Dict[str, Dict[str, dict]] = {}

    async def connect(self, websocket: WebSocket, room_code: str, client_id: str, role: str):
        await websocket.accept()
        room_code = room_code.upper().strip()

        if room_code not in self.rooms:
            self.rooms[room_code] = {}
            self.room_clients[room_code] = {}

        self.rooms[room_code][client_id] = websocket
        self.room_clients[room_code][client_id] = {
            "client_id": client_id,
            "role": role,
            "connected_at": True
        }

        logger.info(f"Client {client_id} ({role}) connected to room {room_code}")

        # Notify existing peers in room
        await self.broadcast_to_room(room_code, {
            "type": "PEER_JOINED",
            "client_id": client_id,
            "role": role,
            "total_peers": len(self.rooms[room_code]),
            "peers": list(self.room_clients[room_code].values())
        }, exclude_client=client_id)

        # Send current room status to newly connected client
        await websocket.send_json({
            "type": "ROOM_STATUS",
            "room_code": room_code,
            "client_id": client_id,
            "role": role,
            "peers": list(self.room_clients[room_code].values())
        })

    def disconnect(self, room_code: str, client_id: str):
        room_code = room_code.upper().strip()
        if room_code in self.rooms:
            if client_id in self.rooms[room_code]:
                del self.rooms[room_code][client_id]
            if client_id in self.room_clients[room_code]:
                del self.room_clients[room_code][client_id]

            if len(self.rooms[room_code]) == 0:
                del self.rooms[room_code]
                del self.room_clients[room_code]
            else:
                # Inform remaining peers
                pass

    async def broadcast_to_room(self, room_code: str, message: dict, exclude_client: Optional[str] = None):
        room_code = room_code.upper().strip()
        if room_code not in self.rooms:
            return

        dead_clients = []
        for c_id, ws in self.rooms[room_code].items():
            if exclude_client and c_id == exclude_client:
                continue
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to {c_id}: {e}")
                dead_clients.append(c_id)

        for dc in dead_clients:
            self.disconnect(room_code, dc)

    async def send_to_client(self, room_code: str, target_client_id: str, message: dict):
        room_code = room_code.upper().strip()
        if room_code in self.rooms and target_client_id in self.rooms[room_code]:
            ws = self.rooms[room_code][target_client_id]
            await ws.send_json(message)

    def get_room_peers(self, room_code: str) -> List[dict]:
        room_code = room_code.upper().strip()
        return list(self.room_clients.get(room_code, {}).values())

    def get_total_connected(self) -> int:
        total = 0
        for r in self.rooms.values():
            total += len(r)
        return total

# Global singleton
manager = ConnectionManager()

