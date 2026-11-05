import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.services.database import DatabaseService
from app.networking.connection_manager import manager
from app.networking.multi_device_manager import mesh_manager
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cipherlink.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed
    logger.info("Initializing CIPHERLINK Secure Cryptography Engine...")
    DatabaseService.init_db()
    logger.info("CIPHERLINK Engine initialized successfully.")
    yield
    # Shutdown
    logger.info("Shutting down CIPHERLINK Gateway.")

app = FastAPI(
    title="CIPHERLINK – Secure File Transfer Using ECC & AES-256-GCM",
    description="Next-generation military-grade secure file transfer platform combining Elliptic Curve Cryptography (ECDH), HKDF-SHA256, and AES-256-GCM.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows browser clients across local network
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Static files and SPA fallback
dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dir = os.path.join(dist_dir, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/")
async def serve_root():
    index_file = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "CIPHERLINK Backend API is operational. Build frontend to view Web UI."}


@app.websocket("/ws/{room_code}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, client_id: str, role: str = "PEER"):
    await manager.connect(websocket, room_code, client_id, role)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                message = json.loads(data_text)
            except Exception:
                continue

            msg_type = message.get("type", "")

            # Dispatch based on message type
            if msg_type in ["PEER_KEY_OFFER", "PEER_KEY_ANSWER", "ECDH_PUBLIC_KEY", "PEER_SIGNATURE"]:
                # Relay cryptographic handshake to other peer in room
                target = message.get("target_client_id")
                if target:
                    await manager.send_to_client(room_code, target, message)
                else:
                    await manager.broadcast_to_room(room_code, message, exclude_client=client_id)

            elif msg_type in ["FILE_OFFER", "FILE_ACCEPT", "FILE_REJECT"]:
                # Relay file transfer agreement
                await manager.broadcast_to_room(room_code, message, exclude_client=client_id)

            elif msg_type == "CHUNK_DATA":
                # Real-time encrypted chunk transmission
                await manager.broadcast_to_room(room_code, message, exclude_client=client_id)

            elif msg_type == "CHUNK_ACK":
                # Acknowledge received chunk to keep progress synchronized
                await manager.broadcast_to_room(room_code, message, exclude_client=client_id)

            elif msg_type == "TRANSFER_COMPLETE":
                # Save completed transfer to database
                meta = message.get("metadata", {})
                if meta:
                    DatabaseService.record_transfer(
                        filename=meta.get("filename", "unknown_file"),
                        filesize=meta.get("filesize", 0),
                        mode=meta.get("mode", "RECEIVER"),
                        peer_id=client_id,
                        algorithm="ECDH(P-256)+AES-256-GCM",
                        status="COMPLETED" if meta.get("verified", True) else "FAILED",
                        duration_ms=meta.get("duration_ms", 100.0),
                        sha256_hash=meta.get("sha256", "")
                    )
                await manager.broadcast_to_room(room_code, message, exclude_client=client_id)

            elif msg_type == "PING":
                await websocket.send_json({"type": "PONG"})

            else:
                # Forward generic room broadcast
                await manager.broadcast_to_room(room_code, message, exclude_client=client_id)

    except WebSocketDisconnect:
        manager.disconnect(room_code, client_id)
        await manager.broadcast_to_room(room_code, {
            "type": "PEER_DISCONNECTED",
            "client_id": client_id,
            "peers": manager.get_room_peers(room_code)
        })
        logger.info(f"Client {client_id} disconnected from room {room_code}")
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(room_code, client_id)

@app.websocket("/ws/network/{device_id}")
async def multi_device_websocket_endpoint(websocket: WebSocket, device_id: str):
    device_id = device_id.upper().strip()
    await mesh_manager.connect_device_socket(device_id, websocket)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                message = json.loads(data_text)
            except Exception:
                continue

            msg_type = message.get("type", "")

            if msg_type == "PAIRING_REQUEST":
                target_id = message.get("target_id", "")
                code = message.get("pairing_code", "")
                ok, note = mesh_manager.pair_devices(device_id, target_id, code)
                await websocket.send_json({
                    "type": "PAIRING_RESPONSE",
                    "success": ok,
                    "target_id": target_id,
                    "message": note,
                    "state": mesh_manager.get_network_state().dict()
                })
                if ok:
                    await mesh_manager.broadcast_mesh_state()

            elif msg_type in ["TRANSFER_START", "CHUNK_STREAM", "CHUNK_ACK", "TRANSFER_COMPLETE", "KEY_EXCHANGE"]:
                ok, note = await mesh_manager.route_transfer_message(device_id, message)
                if not ok:
                    await websocket.send_json({
                        "type": "TRANSFER_ERROR",
                        "error": note
                    })

            elif msg_type == "PING":
                await websocket.send_json({"type": "PONG"})

            else:
                await mesh_manager.broadcast_mesh_state()

    except WebSocketDisconnect:
        mesh_manager.disconnect_device_socket(device_id)
        await mesh_manager.broadcast_mesh_state()
    except Exception as e:
        logger.error(f"MultiDevice WS error for {device_id}: {e}")
        mesh_manager.disconnect_device_socket(device_id)
        await mesh_manager.broadcast_mesh_state()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
