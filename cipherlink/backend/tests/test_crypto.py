import os
import time
import pytest
from app.crypto.ecc_engine import ECCEngine
from app.crypto.aes_engine import AESEngine
from app.crypto.benchmarks import BenchmarkEngine
from app.services.database import DatabaseService

def test_ecc_keypair_generation():
    """Verify SECP256R1 and X25519 keypair generation and serialization."""
    # Test NIST P-256
    priv_p256, pub_p256 = ECCEngine.generate_secp256r1_keypair()
    pem_p256, hex_p256, fp_p256 = ECCEngine.serialize_public_key(pub_p256)
    assert pem_p256.startswith("-----BEGIN PUBLIC KEY-----")
    assert len(hex_p256) > 60
    assert len(fp_p256.split(":")) == 16

    # Test Curve25519
    priv_x, pub_x = ECCEngine.generate_x25519_keypair()
    pem_x, hex_x, fp_x = ECCEngine.serialize_public_key(pub_x)
    assert pem_x.startswith("-----BEGIN PUBLIC KEY-----")
    assert len(hex_x) == 64  # 32 bytes in hex

def test_ecdh_shared_secret_agreement():
    """Verify that Alice and Bob compute the exact same ECDH shared secret."""
    # Alice generates keys
    priv_alice, pub_alice = ECCEngine.generate_secp256r1_keypair()
    # Bob generates keys
    priv_bob, pub_bob = ECCEngine.generate_secp256r1_keypair()

    # Both compute shared secret
    secret_alice = ECCEngine.derive_ecdh_shared_secret(priv_alice, pub_bob)
    secret_bob = ECCEngine.derive_ecdh_shared_secret(priv_bob, pub_alice)

    assert secret_alice == secret_bob
    assert len(secret_alice) == 32

def test_hkdf_key_derivation():
    """Verify HKDF-SHA256 expands shared secret to 256-bit AES key with salt."""
    priv_a, pub_a = ECCEngine.generate_secp256r1_keypair()
    priv_b, pub_b = ECCEngine.generate_secp256r1_keypair()
    shared_secret = ECCEngine.derive_ecdh_shared_secret(priv_a, pub_b)

    salt = os.urandom(16)
    key1, _ = ECCEngine.derive_symmetric_key_hkdf(shared_secret, salt=salt, key_length=32)
    key2, _ = ECCEngine.derive_symmetric_key_hkdf(shared_secret, salt=salt, key_length=32)

    assert key1 == key2
    assert len(key1) == 32  # 256 bits

def test_ecdsa_digital_signatures():
    """Verify ECDSA signing and peer verification."""
    priv, pub = ECCEngine.generate_secp256r1_keypair()
    message = b"CIPHERLINK-HANDSHAKE-AUTHENTICATE-PEER"
    sig = ECCEngine.sign_message(priv, message)

    assert ECCEngine.verify_signature(pub, sig, message) is True
    assert ECCEngine.verify_signature(pub, sig, b"TAMPERED-MESSAGE") is False

def test_aes_chunked_encryption_and_decryption():
    """Verify chunked AES-256-GCM encryption and byte-perfect reconstruction."""
    key = AESEngine.generate_key()
    sample_text = b"CIPHERLINK Military Grade Security System Test Payload. " * 500  # ~28 KB
    file_id = "TEST-FILE-001"

    pkg = AESEngine.encrypt_buffer(key, sample_text, file_id)
    assert pkg["total_chunks"] >= 1
    assert pkg["original_sha256"] == AESEngine.compute_sha256(sample_text)

    # Decrypt and verify
    decrypted, sha_valid = AESEngine.decrypt_buffer(key, pkg)
    assert decrypted == sample_text
    assert sha_valid is True

def test_tamper_detection_gcm():
    """Verify that tampering with ciphertext triggers InvalidTag / rejection."""
    key = AESEngine.generate_key()
    data = b"Highly confidential intelligence file contents."
    pkg = AESEngine.encrypt_buffer(key, data, "TAMPER-TEST")

    chunk = pkg["chunks"][0]
    tamper_result = AESEngine.simulate_tamper(key, chunk, "TAMPER-TEST")
    assert tamper_result["tampered_detected"] is True
    assert "tampered" in tamper_result["error_message"].lower() or "integrity" in tamper_result["error_message"].lower()

def test_benchmarks_live_execution():
    """Verify genuine benchmark execution runs without failure."""
    report = BenchmarkEngine.run_benchmarks(algorithm_filter="ALL", file_size_mb=1, iterations=1)
    assert len(report.results) >= 5
    assert report.is_live_measurement is True
    assert any("ECC" in r.algorithm for r in report.results)
    assert any("RSA" in r.algorithm for r in report.results)
    assert any("AES" in r.algorithm for r in report.results)

def test_database_and_stats():
    """Verify SQLite persistence and statistics calculation."""
    DatabaseService.init_db()
    rec = DatabaseService.record_transfer(
        filename="test_payload.bin",
        filesize=2048,
        mode="SENDER",
        peer_id="PEER_X",
        algorithm="ECDH(P-256)+AES-256-GCM",
        status="COMPLETED",
        duration_ms=45.2,
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    assert rec.id.startswith("TXF-")

    stats = DatabaseService.get_system_stats()
    assert stats.total_files_transferred >= 1
    assert stats.successful_transfers >= 1

def test_three_cryptographic_steps_workflow():
    """Verify the 3-step action sequence: 1. ECC keygen -> 2. ECDH + HKDF session -> 3. AES-GCM chunk transfer."""
    from app.services.crypto_session_manager import CryptoSessionManager
    sm = CryptoSessionManager()

    # Step 1: Generate real SECP256R1 keys for Alice and Bob
    t0 = time.perf_counter()
    priv_a, pub_a = ECCEngine.generate_secp256r1_keypair()
    keygen_ms = (time.perf_counter() - t0) * 1000.0
    alice_info = sm.store_client_key("ALICE", priv_a, pub_a, "SECP256R1", keygen_ms)
    assert alice_info["public_pem"].startswith("-----BEGIN PUBLIC KEY-----")
    assert alice_info["fingerprint"] is not None
    assert alice_info["signature"] is not None
    assert alice_info["keygen_time_ms"] > 0

    priv_b, pub_b = ECCEngine.generate_secp256r1_keypair()
    bob_info = sm.store_client_key("BOB", priv_b, pub_b, "SECP256R1", keygen_ms)

    # Step 2: Establish connection via ECDH + HKDF-SHA256
    session = sm.establish_session(
        session_id="SESS-TEST-001",
        sender_id="ALICE",
        receiver_id="BOB",
        curve="SECP256R1",
        peer_public_pem=bob_info["public_pem"],
        peer_name="Bob Workstation"
    )
    assert session["status"] == "AUTHENTICATED"
    assert session["peer_authenticated"] is True
    assert session["ecdh_status"] == "SHARED_SECRET_AGREED"
    assert session["hkdf_status"] == "256_BIT_AES_KEY_DERIVED"
    assert len(session["aes_key"]) == 32

    # Step 3: Encrypt file using session key, verify chunks, decrypt, verify SHA-256
    session_key = sm.get_session_aes_key("SESS-TEST-001")
    file_bytes = b"SECRET MISSION TELEMETRY DATA RECONNAISSANCE" * 1500  # ~66 KB, forces multi-chunk
    encrypted_pkg = AESEngine.encrypt_buffer(session_key, file_bytes, "FILE-TEST-3STEP")
    assert encrypted_pkg["total_chunks"] >= 2

    # Reassemble and decrypt
    decrypted, sha_valid = AESEngine.decrypt_buffer(session_key, encrypted_pkg)
    assert decrypted == file_bytes
    assert sha_valid is True

    # Test wrong-key rejection
    wrong_key = AESEngine.generate_key()
    with pytest.raises(Exception):
        AESEngine.decrypt_buffer(wrong_key, encrypted_pkg)

    # Test modified ciphertext rejection
    tamper_chunk = encrypted_pkg["chunks"][0]
    tamper_res = AESEngine.simulate_tamper(session_key, tamper_chunk, "FILE-TEST-3STEP")
    assert tamper_res["tampered_detected"] is True


