from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class KeyPairResponse(BaseModel):
    client_id: str = "SENDER"
    curve: str
    public_key_hex: str
    public_key_pem: str
    algorithm: str
    fingerprint: str
    description: str
    keygen_time_ms: float = 0.0
    signature: Optional[str] = None
    status: str = "KEY_GENERATED"

class EstablishSessionRequest(BaseModel):
    session_id: str = "SESS-MAIN"
    sender_id: str = "SENDER"
    receiver_id: str = "RECEIVER"
    peer_name: Optional[str] = "Receiver Station (Bob Node)"
    curve: str = "SECP256R1"
    receiver_public_key_pem: Optional[str] = None

class EstablishSessionResponse(BaseModel):
    session_id: str
    status: str
    sender_id: str
    receiver_id: str
    peer_name: str
    peer_authenticated: bool
    ecdh_status: str
    hkdf_status: str
    curve: str
    shared_secret_hash: str
    aes_key_preview: str
    salt_hex: str
    mathematical_proof: str
    created_at: str

class DeriveSecretRequest(BaseModel):
    curve: str = Field(default="SECP256R1", description="SECP256R1 or X25519")
    private_key_pem: Optional[str] = None
    peer_public_key_pem: Optional[str] = None
    peer_public_key_hex: Optional[str] = None
    salt_hex: Optional[str] = None
    info: Optional[str] = "cipherlink-v1-aes256-gcm"

class DeriveSecretResponse(BaseModel):
    curve: str
    shared_secret_hash: str
    aes_key_preview: str  # Masked preview e.g. "9a4f...3b1c (256 bits)"
    hkdf_salt_used: str
    derivation_info: str
    mathematical_proof: str
    status: str

class BenchmarkRequest(BaseModel):
    algorithm: str = Field(default="ALL", description="ECC, RSA, AES, or ALL")
    file_size_mb: int = Field(default=10, description="1, 10, 50, 100, 500")
    iterations: int = Field(default=3, description="Iterations to average")

class BenchmarkResultItem(BaseModel):
    operation: str
    algorithm: str
    category: str # "Asymmetric Key Agreement", "Asymmetric Key Transport", "Symmetric Encryption", "Digital Signatures"
    key_size_bits: int
    equivalent_security_level_bits: int
    duration_ms: float
    throughput_mb_s: Optional[float] = None
    cpu_cycles_est: Optional[str] = None
    notes: str

class BenchmarkReport(BaseModel):
    tested_file_size_mb: int
    timestamp: str
    system_cpu: str
    results: List[BenchmarkResultItem]
    insights: List[str]
    is_live_measurement: bool = True

class TransferRecord(BaseModel):
    id: str
    filename: str
    filesize: int
    mode: str  # "SENDER" or "RECEIVER"
    peer_id: str
    algorithm: str
    status: str  # "COMPLETED", "FAILED", "IN_PROGRESS"
    duration_ms: float
    sha256_hash: str
    created_at: str

class SecurityLogRecord(BaseModel):
    id: str
    event_type: str
    severity: str  # "INFO", "WARNING", "SUCCESS", "CRITICAL"
    details: str
    client_ip: str
    created_at: str

class SystemStats(BaseModel):
    total_files_transferred: int
    total_encrypted_bytes: int
    successful_transfers: int
    failed_transfers: int
    active_algorithm: str
    security_status: str
    network_status: str
    connected_peers: int

class DeviceSlotModel(BaseModel):
    device_id: str
    name: str
    role_type: str
    ip_address: str
    status: str  # "ONLINE", "OFFLINE", "AUTHENTICATED", "TRANSFERRING"
    pairing_code: str
    public_key_fingerprint: Optional[str] = None
    connected_since: Optional[str] = None
    authorized_peers: List[str] = []
    active_transfers_count: int = 0

class DevicePairingRequest(BaseModel):
    initiator_device_id: str
    target_device_id: str
    pairing_code: str
    signature: Optional[str] = None

class PairwiseSessionModel(BaseModel):
    session_id: str
    device_a: str
    device_b: str
    curve: str = "SECP256R1"
    status: str = "PAIRED"
    shared_key_preview: Optional[str] = None
    created_at: str

class MultiDeviceTransferEvent(BaseModel):
    transfer_id: str
    sender_id: str
    receiver_id: str
    filename: str
    filesize: int
    status: str  # "ENCRYPTING", "TRANSFERRING", "COMPLETED", "FAILED", "REJECTED"
    progress_percent: float
    speed_mb_s: float
    sha256_hash: str
    duration_ms: float = 0.0

class MultiDeviceNetworkState(BaseModel):
    devices: List[DeviceSlotModel]
    active_pairwise_sessions: List[PairwiseSessionModel]
    active_transfers: List[MultiDeviceTransferEvent]
    total_network_peers: int


