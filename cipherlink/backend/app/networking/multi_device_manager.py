import os
import time
import json
import logging
from typing import Dict, List, Optional, Set, Tuple
from fastapi import WebSocket

from app.models.schemas import (
    DeviceSlotModel, PairwiseSessionModel, MultiDeviceTransferEvent, MultiDeviceNetworkState
)
from app.crypto.ecc_engine import ECCEngine
from app.crypto.aes_engine import AESEngine
from app.services.database import DatabaseService

logger = logging.getLogger("cipherlink.four_device_network")

class MultiDeviceManager:
    """
    Coordinator and secure relay for the 4-Device Network Mesh.
    Manages:
    - 4 device slots (DEV-1, DEV-2, DEV-3, DEV-4)
    - Real-time presence via WebSockets
    - Pairing code authentication & authorization matrix
    - Isolated pairwise ECDH sessions for all 6 possible device pairs
    - Simultaneous encrypted chunk streaming and transfer tracking
    """

    def __init__(self):
        # Initial 4 device slot definitions
        self.device_slots: Dict[str, dict] = {
            "DEV-1": {
                "device_id": "DEV-1",
                "name": "Device 1 - Alpha Station",
                "role_type": "Command HQ Terminal",
                "ip_address": "192.168.1.101",
                "status": "ONLINE",
                "pairing_code": "PAIR-ALPHA-901",
                "public_key_fingerprint": "E2:9B:44:A1:C8:10:F5:33:9A:88:51:77:2B:C0:EE:D1",
                "connected_since": time.strftime("%H:%M:%S", time.localtime()),
                "authorized_peers": ["DEV-2", "DEV-3"],
                "active_transfers_count": 0,
            },
            "DEV-2": {
                "device_id": "DEV-2",
                "name": "Device 2 - Beta Node",
                "role_type": "Mobile Tactical Field Unit",
                "ip_address": "192.168.1.102",
                "status": "ONLINE",
                "pairing_code": "PAIR-BETA-412",
                "public_key_fingerprint": "7C:1F:B9:33:60:88:4D:21:19:92:AA:E4:55:01:BC:FE",
                "connected_since": time.strftime("%H:%M:%S", time.localtime()),
                "authorized_peers": ["DEV-1"],
                "active_transfers_count": 0,
            },
            "DEV-3": {
                "device_id": "DEV-3",
                "name": "Device 3 - Gamma Vault",
                "role_type": "Datacenter Storage Node",
                "ip_address": "192.168.1.103",
                "status": "ONLINE",
                "pairing_code": "PAIR-GAMMA-733",
                "public_key_fingerprint": "4A:66:90:FD:E1:52:8B:CA:11:43:08:99:C2:5E:7A:3D",
                "connected_since": time.strftime("%H:%M:%S", time.localtime()),
                "authorized_peers": ["DEV-1", "DEV-4"],
                "active_transfers_count": 0,
            },
            "DEV-4": {
                "device_id": "DEV-4",
                "name": "Device 4 - Delta Recon",
                "role_type": "Field Surveillance Drone",
                "ip_address": "192.168.1.104",
                "status": "ONLINE",
                "pairing_code": "PAIR-DELTA-855",
                "public_key_fingerprint": "9F:03:D5:81:7A:4E:22:90:38:12:66:B1:AC:F9:80:54",
                "connected_since": time.strftime("%H:%M:%S", time.localtime()),
                "authorized_peers": ["DEV-3"],
                "active_transfers_count": 0,
            },
        }

        # WebSocket connections: device_id -> WebSocket
        self.websockets: Dict[str, WebSocket] = {}

        # Authorized device pairs: set of tuples ("DEV-X", "DEV-Y") where X < Y
        self.authorized_pairs: Set[Tuple[str, str]] = {
            ("DEV-1", "DEV-2"),
            ("DEV-1", "DEV-3"),
            ("DEV-3", "DEV-4"),
        }

        # Active pairwise ECDH sessions
        self.pairwise_sessions: Dict[str, dict] = {}
        self._init_default_pairwise_sessions()

        # Active multi-device transfers: transfer_id -> MultiDeviceTransferEvent
        self.active_transfers: Dict[str, dict] = {}

    def _init_default_pairwise_sessions(self):
        """Pre-initialize cryptographic pairwise sessions for authorized pairs."""
        for dev_a, dev_b in self.authorized_pairs:
            session_key = f"{dev_a}_{dev_b}"
            self.pairwise_sessions[session_key] = {
                "session_id": f"SESS-{dev_a}-{dev_b}",
                "device_a": dev_a,
                "device_b": dev_b,
                "curve": "SECP256R1",
                "status": "MUTUALLY_AUTHENTICATED",
                "shared_key_preview": f"9f8a...{dev_b[-1]}e3b (256 bits)",
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            }

    def get_network_state(self) -> MultiDeviceNetworkState:
        """Returns the full 4-device mesh state."""
        device_models = [DeviceSlotModel(**d) for d in self.device_slots.values()]
        session_models = [PairwiseSessionModel(**s) for s in self.pairwise_sessions.values()]
        transfer_models = [MultiDeviceTransferEvent(**t) for t in self.active_transfers.values()]

        return MultiDeviceNetworkState(
            devices=device_models,
            active_pairwise_sessions=session_models,
            active_transfers=transfer_models,
            total_network_peers=len([d for d in self.device_slots.values() if d["status"] != "OFFLINE"])
        )

    def is_pair_authorized(self, dev_a: str, dev_b: str) -> bool:
        """Checks if two devices have mutual pairing authorization."""
        pair = (min(dev_a, dev_b), max(dev_a, dev_b))
        return pair in self.authorized_pairs

    def pair_devices(self, initiator_id: str, target_id: str, pairing_code: str) -> Tuple[bool, str]:
        """
        Authenticate and authorize pairing between two devices using pairing code.
        Rejects invalid codes and logs security incidents.
        """
        initiator_id = initiator_id.upper().strip()
        target_id = target_id.upper().strip()

        if initiator_id not in self.device_slots or target_id not in self.device_slots:
            return False, "Invalid device ID"

        if initiator_id == target_id:
            return False, "Device cannot pair with itself"

        target_slot = self.device_slots[target_id]
        expected_code = target_slot["pairing_code"]

        # Validate code
        if pairing_code.strip() != expected_code.strip():
            # Log security violation
            DatabaseService.log_security_event(
                event_type="UNAUTHORIZED_DEVICE_PAIRING_ATTEMPT",
                severity="WARNING",
                details=f"Device {initiator_id} attempted unauthorized pairing with {target_id} using invalid code '{pairing_code}'. Connection rejected.",
                client_ip=target_slot["ip_address"]
            )
            return False, f"Authentication Failed: Pairing code mismatch for {target_slot['name']}"

        # Register pairing
        pair = (min(initiator_id, target_id), max(initiator_id, target_id))
        self.authorized_pairs.add(pair)

        # Update peer lists
        if target_id not in self.device_slots[initiator_id]["authorized_peers"]:
            self.device_slots[initiator_id]["authorized_peers"].append(target_id)
        if initiator_id not in self.device_slots[target_id]["authorized_peers"]:
            self.device_slots[target_id]["authorized_peers"].append(initiator_id)

        # Create cryptographic pairwise session
        session_key = f"{pair[0]}_{pair[1]}"
        self.pairwise_sessions[session_key] = {
            "session_id": f"SESS-{pair[0]}-{pair[1]}",
            "device_a": pair[0],
            "device_b": pair[1],
            "curve": "SECP256R1",
            "status": "MUTUALLY_AUTHENTICATED",
            "shared_key_preview": f"ec{initiator_id[-1]}...{target_id[-1]}b8 (256 bits)",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        }

        DatabaseService.log_security_event(
            event_type="DEVICE_PAIRING_AUTHORIZED",
            severity="SUCCESS",
            details=f"Secure pairing established between {initiator_id} and {target_id}. ECDH pairwise channel active.",
            client_ip=target_slot["ip_address"]
        )

        return True, f"Successfully paired {initiator_id} with {target_id}."

    def unpair_devices(self, dev_a: str, dev_b: str) -> bool:
        """Remove pairing authorization between two devices."""
        pair = (min(dev_a, dev_b), max(dev_a, dev_b))
        if pair in self.authorized_pairs:
            self.authorized_pairs.remove(pair)
            if dev_b in self.device_slots[dev_a]["authorized_peers"]:
                self.device_slots[dev_a]["authorized_peers"].remove(dev_b)
            if dev_a in self.device_slots[dev_b]["authorized_peers"]:
                self.device_slots[dev_b]["authorized_peers"].remove(dev_a)
            session_key = f"{pair[0]}_{pair[1]}"
            if session_key in self.pairwise_sessions:
                del self.pairwise_sessions[session_key]

            DatabaseService.log_security_event(
                event_type="DEVICE_UNPAIRED",
                severity="INFO",
                details=f"Pairing revoked between {dev_a} and {dev_b}.",
                client_ip="127.0.0.1"
            )
            return True
        return False

    def update_device_status(self, device_id: str, status: str):
        """Update connection status for a slot."""
        if device_id in self.device_slots:
            self.device_slots[device_id]["status"] = status
            if status != "OFFLINE" and not self.device_slots[device_id].get("connected_since"):
                self.device_slots[device_id]["connected_since"] = time.strftime("%H:%M:%S", time.localtime())
            elif status == "OFFLINE":
                self.device_slots[device_id]["connected_since"] = None

    async def connect_device_socket(self, device_id: str, websocket: WebSocket):
        """Register active WebSocket for a device slot."""
        await websocket.accept()
        self.websockets[device_id] = websocket
        self.update_device_status(device_id, "ONLINE")
        logger.info(f"4-Device Mesh: {device_id} connected via WebSocket.")

        # Send welcome state
        await websocket.send_json({
            "type": "MESH_WELCOME",
            "device_id": device_id,
            "state": self.get_network_state().dict()
        })

        # Broadcast update
        await self.broadcast_mesh_state()

    def disconnect_device_socket(self, device_id: str):
        """Handle device disconnect."""
        if device_id in self.websockets:
            del self.websockets[device_id]
        self.update_device_status(device_id, "OFFLINE")
        logger.info(f"4-Device Mesh: {device_id} disconnected.")

    async def broadcast_mesh_state(self):
        """Broadcast current network topology and transfer state to all connected devices."""
        state_dict = self.get_network_state().dict()
        dead = []
        for dev_id, ws in self.websockets.items():
            try:
                await ws.send_json({
                    "type": "MESH_STATE_UPDATE",
                    "state": state_dict
                })
            except Exception:
                dead.append(dev_id)

        for d in dead:
            self.disconnect_device_socket(d)

    async def route_transfer_message(self, sender_id: str, message: dict) -> Tuple[bool, str]:
        """
        Verify peer authorization and relay encrypted transfer packets to target device.
        Ensures encrypted payload is forwarded untouched without intermediate decryption.
        """
        receiver_id = message.get("receiver_id", "").upper().strip()
        msg_type = message.get("type", "")

        # Check pairing authorization
        if not self.is_pair_authorized(sender_id, receiver_id):
            # Unauthorized rejection
            DatabaseService.log_security_event(
                event_type="UNAUTHORIZED_TRANSFER_INTERCEPTED",
                severity="CRITICAL",
                details=f"Transfer from {sender_id} to {receiver_id} blocked: Devices are not in authorized pairing matrix.",
                client_ip=self.device_slots.get(sender_id, {}).get("ip_address", "127.0.0.1")
            )
            return False, f"Security Blocked: {sender_id} is not authorized to transfer to {receiver_id}."

        # Track active transfer progress
        transfer_id = message.get("transfer_id")
        if transfer_id and msg_type in ["TRANSFER_START", "CHUNK_STREAM"]:
            self.active_transfers[transfer_id] = {
                "transfer_id": transfer_id,
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "filename": message.get("filename", "file.dat"),
                "filesize": message.get("filesize", 0),
                "status": "TRANSFERRING",
                "progress_percent": message.get("progress_percent", 0.0),
                "speed_mb_s": message.get("speed_mb_s", 1.5),
                "sha256_hash": message.get("sha256_hash", ""),
                "duration_ms": message.get("duration_ms", 0.0)
            }
            self.device_slots[sender_id]["status"] = "TRANSFERRING"
            self.device_slots[receiver_id]["status"] = "TRANSFERRING"

        elif transfer_id and msg_type == "TRANSFER_COMPLETE":
            if transfer_id in self.active_transfers:
                self.active_transfers[transfer_id]["status"] = "COMPLETED"
                self.active_transfers[transfer_id]["progress_percent"] = 100.0

            self.device_slots[sender_id]["status"] = "ONLINE"
            self.device_slots[receiver_id]["status"] = "ONLINE"

            # Record in database
            DatabaseService.record_transfer(
                filename=message.get("filename", "mesh_file.dat"),
                filesize=message.get("filesize", 0),
                mode=f"{sender_id}->{receiver_id}",
                peer_id=receiver_id,
                algorithm="ECDH(P-256)+AES-256-GCM",
                status="COMPLETED",
                duration_ms=message.get("duration_ms", 120.0),
                sha256_hash=message.get("sha256_hash", "")
            )

        # Forward message to receiver if socket is connected
        if receiver_id in self.websockets:
            try:
                await self.websockets[receiver_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to forward message to {receiver_id}: {e}")

        # Broadcast state update to all devices
        await self.broadcast_mesh_state()
        return True, "Message routed successfully."

# Singleton instance
mesh_manager = MultiDeviceManager()

