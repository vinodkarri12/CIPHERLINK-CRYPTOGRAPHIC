import pytest
import os
import time
from app.networking.multi_device_manager import MultiDeviceManager
from app.crypto.ecc_engine import ECCEngine
from app.crypto.aes_engine import AESEngine
from app.services.database import DatabaseService

@pytest.fixture
def mesh():
    """Create a fresh isolated MultiDeviceManager instance for testing."""
    return MultiDeviceManager()

def test_four_devices_online_simultaneously(mesh):
    """Verify that all 4 device slots exist and can be online simultaneously."""
    state = mesh.get_network_state()
    assert len(state.devices) == 4
    device_ids = {d.device_id for d in state.devices}
    assert device_ids == {"DEV-1", "DEV-2", "DEV-3", "DEV-4"}

    # Set all 4 online
    for dev_id in ["DEV-1", "DEV-2", "DEV-3", "DEV-4"]:
        mesh.update_device_status(dev_id, "ONLINE")

    updated_state = mesh.get_network_state()
    assert updated_state.total_network_peers == 4
    for d in updated_state.devices:
        assert d.status == "ONLINE"
        assert d.ip_address.startswith("192.168.1.")
        assert d.pairing_code.startswith("PAIR-")

def test_all_six_device_pairs_pairing_and_authorization(mesh):
    """Verify that all 6 possible bidirectional device pairs can authenticate and pair."""
    all_pairs = [
        ("DEV-1", "DEV-2"),
        ("DEV-1", "DEV-3"),
        ("DEV-1", "DEV-4"),
        ("DEV-2", "DEV-3"),
        ("DEV-2", "DEV-4"),
        ("DEV-3", "DEV-4"),
    ]

    for dev_a, dev_b in all_pairs:
        target_code = mesh.device_slots[dev_b]["pairing_code"]
        ok, msg = mesh.pair_devices(dev_a, dev_b, target_code)
        assert ok is True, f"Failed to pair {dev_a} and {dev_b}: {msg}"
        assert mesh.is_pair_authorized(dev_a, dev_b) is True
        assert mesh.is_pair_authorized(dev_b, dev_a) is True

    state = mesh.get_network_state()
    assert len(state.active_pairwise_sessions) >= 6

def test_unauthorized_device_rejection(mesh):
    """Verify that unpaired devices or invalid codes are strictly rejected and logged."""
    # Reset pairing between DEV-2 and DEV-4
    mesh.unpair_devices("DEV-2", "DEV-4")
    assert mesh.is_pair_authorized("DEV-2", "DEV-4") is False

    # 1. Attempt pairing with incorrect code
    bad_code = "PAIR-WRONG-999"
    ok, err_msg = mesh.pair_devices("DEV-2", "DEV-4", bad_code)
    assert ok is False
    assert "Mismatch" in err_msg or "Failed" in err_msg
    assert mesh.is_pair_authorized("DEV-2", "DEV-4") is False

    # 2. Check security audit log recorded the violation
    logs = DatabaseService.get_security_logs(5)
    violation_logged = any("UNAUTHORIZED" in log.event_type for log in logs)
    assert violation_logged is True

def test_pairwise_isolated_ecc_encryption_and_decryption(mesh):
    """Verify that every device has its own private key and separate session keys."""
    # Device 1 generates its keypair
    priv_1, pub_1 = ECCEngine.generate_secp256r1_keypair()
    # Device 2 generates its keypair
    priv_2, pub_2 = ECCEngine.generate_secp256r1_keypair()
    # Device 3 generates its keypair
    priv_3, pub_3 = ECCEngine.generate_secp256r1_keypair()

    # D1 and D2 compute pairwise shared secret S_12
    s_12_from_1 = ECCEngine.derive_ecdh_shared_secret(priv_1, pub_2)
    s_12_from_2 = ECCEngine.derive_ecdh_shared_secret(priv_2, pub_1)
    assert s_12_from_1 == s_12_from_2

    # D1 and D3 compute pairwise shared secret S_13
    s_13_from_1 = ECCEngine.derive_ecdh_shared_secret(priv_1, pub_3)
    s_13_from_3 = ECCEngine.derive_ecdh_shared_secret(priv_3, pub_1)
    assert s_13_from_1 == s_13_from_3

    # Cryptographic Isolation: S_12 must NEVER equal S_13!
    assert s_12_from_1 != s_13_from_1

    # Derive separate AES-256 keys via HKDF
    salt = os.urandom(16)
    k_12, _ = ECCEngine.derive_symmetric_key_hkdf(s_12_from_1, salt=salt, info=b"mesh-D1-D2")
    k_13, _ = ECCEngine.derive_symmetric_key_hkdf(s_13_from_1, salt=salt, info=b"mesh-D1-D3")
    assert k_12 != k_13

    # Encrypt payload from D1 to D2
    payload = b"TOP SECRET SATELLITE COMMAND PACKET FOR DEVICE 2 ONLY"
    pkg = AESEngine.encrypt_buffer(k_12, payload, "TX-D1-D2-001")

    # D2 can decrypt
    decrypted_by_2, valid = AESEngine.decrypt_buffer(k_12, pkg)
    assert decrypted_by_2 == payload
    assert valid is True

    # D3 CANNOT decrypt with k_13 (tamper/wrong key rejection)
    with pytest.raises(Exception):
        AESEngine.decrypt_buffer(k_13, pkg)

def test_simultaneous_transfers_tracking(mesh):
    """Verify that multiple independent transfers can run concurrently across different pairs."""
    # Authorize D1-D2 and D3-D4
    mesh.pair_devices("DEV-1", "DEV-2", mesh.device_slots["DEV-2"]["pairing_code"])
    mesh.pair_devices("DEV-3", "DEV-4", mesh.device_slots["DEV-4"]["pairing_code"])

    # Start Transfer A: D1 -> D2
    tx_a = "TX-SIM-A"
    mesh.active_transfers[tx_a] = {
        "transfer_id": tx_a,
        "sender_id": "DEV-1",
        "receiver_id": "DEV-2",
        "filename": "recon_intel_alpha.pdf",
        "filesize": 4096000,
        "status": "TRANSFERRING",
        "progress_percent": 45.0,
        "speed_mb_s": 8.4,
        "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "duration_ms": 110.0
    }

    # Start Transfer B: D3 -> D4 (concurrently)
    tx_b = "TX-SIM-B"
    mesh.active_transfers[tx_b] = {
        "transfer_id": tx_b,
        "sender_id": "DEV-3",
        "receiver_id": "DEV-4",
        "filename": "firmware_patch_gamma.bin",
        "filesize": 8192000,
        "status": "TRANSFERRING",
        "progress_percent": 30.0,
        "speed_mb_s": 12.1,
        "sha256_hash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
        "duration_ms": 140.0
    }

    state = mesh.get_network_state()
    assert len(state.active_transfers) == 2
    active_ids = {t.transfer_id for t in state.active_transfers}
    assert active_ids == {tx_a, tx_b}

def test_device_disconnect_and_reconnect(mesh):
    """Verify state transitions when a device disconnects and reconnects."""
    dev_id = "DEV-4"
    mesh.update_device_status(dev_id, "ONLINE")
    assert mesh.device_slots[dev_id]["status"] == "ONLINE"

    # Simulate disconnect
    mesh.disconnect_device_socket(dev_id)
    assert mesh.device_slots[dev_id]["status"] == "OFFLINE"
    assert mesh.device_slots[dev_id]["connected_since"] is None

    # Simulate reconnect
    mesh.update_device_status(dev_id, "ONLINE")
    assert mesh.device_slots[dev_id]["status"] == "ONLINE"
    assert mesh.device_slots[dev_id]["connected_since"] is not None

