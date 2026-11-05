export interface SystemStats {
  total_files_transferred: number;
  total_encrypted_bytes: number;
  successful_transfers: number;
  failed_transfers: number;
  active_algorithm: string;
  security_status: string;
  network_status: string;
  connected_peers: number;
}

export interface TransferRecord {
  id: string;
  filename: string;
  filesize: number;
  mode: 'SENDER' | 'RECEIVER';
  peer_id: string;
  algorithm: string;
  status: string;
  duration_ms: number;
  sha256_hash: string;
  created_at: string;
}

export interface SecurityLogRecord {
  id: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'SUCCESS' | 'CRITICAL';
  details: string;
  client_ip: string;
  created_at: string;
}

export interface KeyPairResponse {
  client_id?: string;
  curve: string;
  public_key_hex: string;
  public_key_pem: string;
  algorithm: string;
  fingerprint: string;
  description: string;
  keygen_time_ms?: number;
  signature?: string;
  status?: string;
}

export interface EstablishSessionResponse {
  session_id: string;
  status: string;
  sender_id: string;
  receiver_id: string;
  peer_name: string;
  peer_authenticated: boolean;
  ecdh_status: string;
  hkdf_status: string;
  curve: string;
  shared_secret_hash: string;
  aes_key_preview: string;
  salt_hex: string;
  mathematical_proof: string;
  created_at: string;
}

export interface DeriveSecretResponse {
  curve: string;
  shared_secret_hash: string;
  aes_key_preview: string;
  hkdf_salt_used: string;
  derivation_info: string;
  mathematical_proof: string;
  status: string;
}

export interface BenchmarkResultItem {
  operation: string;
  algorithm: string;
  category: string;
  key_size_bits: number;
  equivalent_security_level_bits: number;
  duration_ms: number;
  throughput_mb_s?: number;
  cpu_cycles_est?: string;
  notes: string;
}

export interface BenchmarkReport {
  tested_file_size_mb: number;
  timestamp: string;
  system_cpu: string;
  results: BenchmarkResultItem[];
  insights: string[];
  is_live_measurement: boolean;
}

export interface DeviceSlotModel {
  device_id: string;
  name: string;
  role_type: string;
  ip_address: string;
  status: 'ONLINE' | 'OFFLINE' | 'AUTHENTICATED' | 'TRANSFERRING';
  pairing_code: string;
  public_key_fingerprint?: string;
  connected_since?: string;
  authorized_peers: string[];
  active_transfers_count: number;
}

export interface PairwiseSessionModel {
  session_id: string;
  device_a: string;
  device_b: string;
  curve: string;
  status: string;
  shared_key_preview?: string;
  created_at: string;
}

export interface MultiDeviceTransferEvent {
  transfer_id: string;
  sender_id: string;
  receiver_id: string;
  filename: string;
  filesize: number;
  status: 'ENCRYPTING' | 'TRANSFERRING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  progress_percent: number;
  speed_mb_s: number;
  sha256_hash: string;
  duration_ms: number;
}

export interface MultiDeviceNetworkState {
  devices: DeviceSlotModel[];
  active_pairwise_sessions: PairwiseSessionModel[];
  active_transfers: MultiDeviceTransferEvent[];
  total_network_peers: number;
}

const API_BASE = '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
  },

  async getTransferHistory(limit = 20): Promise<TransferRecord[]> {
    const res = await fetch(`${API_BASE}/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch transfer history');
    return res.json();
  },

  async getSecurityLogs(limit = 50): Promise<SecurityLogRecord[]> {
    const res = await fetch(`${API_BASE}/security/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch security logs');
    return res.json();
  },

  async generateECCKeys(curve = 'SECP256R1', clientId = 'SENDER', forceRegenerate = false): Promise<KeyPairResponse> {
    const formData = new FormData();
    formData.append('curve', curve);
    formData.append('client_id', clientId);
    formData.append('force_regenerate', forceRegenerate.toString());
    const res = await fetch(`${API_BASE}/crypto/ecc/generate-keys`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to generate ECC keys');
    return res.json();
  },

  async establishSession(params: {
    session_id?: string;
    sender_id?: string;
    receiver_id?: string;
    peer_name?: string;
    curve?: string;
    receiver_public_key_pem?: string;
  }): Promise<EstablishSessionResponse> {
    const res = await fetch(`${API_BASE}/crypto/session/establish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: params.session_id || 'SESS-SECURE-ALPHA',
        sender_id: params.sender_id || 'SENDER',
        receiver_id: params.receiver_id || 'RECEIVER',
        peer_name: params.peer_name || 'Receiver Station (Bob Node)',
        curve: params.curve || 'SECP256R1',
        receiver_public_key_pem: params.receiver_public_key_pem,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to establish secure session' }));
      throw new Error(err.detail || 'Failed to establish secure session');
    }
    return res.json();
  },

  async deriveSharedSecret(params: {
    curve?: string;
    salt_hex?: string;
    info?: string;
  }): Promise<DeriveSecretResponse> {
    const res = await fetch(`${API_BASE}/crypto/ecc/derive-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to derive shared secret');
    return res.json();
  },

  async getCurveMathDetails(curve = 'SECP256R1') {
    const res = await fetch(`${API_BASE}/crypto/ecc/math-details?curve=${curve}`);
    if (!res.ok) throw new Error('Failed to fetch curve details');
    return res.json();
  },

  async encryptFile(file: File, sessionId?: string, fileId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) formData.append('session_id', sessionId);
    if (fileId) formData.append('file_id', fileId);
    const res = await fetch(`${API_BASE}/crypto/encrypt-file`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Encryption failed');
    return res.json();
  },

  async decryptFile(payload: any) {
    const res = await fetch(`${API_BASE}/crypto/decrypt-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Decryption failed' }));
      throw new Error(err.detail || 'Decryption failed');
    }
    return res.json();
  },

  async simulateTamper(payload: any) {
    const res = await fetch(`${API_BASE}/crypto/simulate-tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Tamper simulation request failed');
    return res.json();
  },

  async runBenchmarks(algorithm = 'ALL', fileSizeMb = 10, iterations = 3): Promise<BenchmarkReport> {
    const res = await fetch(`${API_BASE}/benchmarks/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm,
        file_size_mb: fileSizeMb,
        iterations,
      }),
    });
    if (!res.ok) throw new Error('Benchmark execution failed');
    return res.json();
  },

  async recordTransfer(data: {
    filename: string;
    filesize: number;
    mode: string;
    peer_id: string;
    algorithm?: string;
    status?: string;
    duration_ms?: number;
    sha256_hash: string;
  }): Promise<TransferRecord> {
    const formData = new FormData();
    formData.append('filename', data.filename);
    formData.append('filesize', data.filesize.toString());
    formData.append('mode', data.mode);
    formData.append('peer_id', data.peer_id);
    formData.append('algorithm', data.algorithm || 'ECDH(P-256)+AES-256-GCM');
    formData.append('status', data.status || 'COMPLETED');
    formData.append('duration_ms', (data.duration_ms || 100).toString());
    formData.append('sha256_hash', data.sha256_hash);

    const res = await fetch(`${API_BASE}/transfers/record`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to record transfer');
    return res.json();
  },

  async getMeshState(): Promise<MultiDeviceNetworkState> {
    const res = await fetch(`${API_BASE}/network/mesh`);
    if (!res.ok) throw new Error('Failed to fetch mesh network state');
    return res.json();
  },

  async pairMeshDevices(initiatorId: string, targetId: string, pairingCode: string) {
    const res = await fetch(`${API_BASE}/network/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initiator_device_id: initiatorId,
        target_device_id: targetId,
        pairing_code: pairingCode,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Pairing failed' }));
      throw new Error(err.detail || 'Pairing authentication failed');
    }
    return res.json();
  },

  async unpairMeshDevices(initiatorId: string, targetId: string) {
    const formData = new FormData();
    formData.append('initiator_id', initiatorId);
    formData.append('target_id', targetId);
    const res = await fetch(`${API_BASE}/network/unpair`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to unpair devices');
    return res.json();
  },

  async setDeviceStatus(deviceId: string, status: string) {
    const formData = new FormData();
    formData.append('status', status);
    const res = await fetch(`${API_BASE}/network/device/${deviceId}/status`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update device status');
    return res.json();
  },

  async initiateMeshTransfer(senderId: string, receiverId: string, filename?: string, filesize?: number) {
    const formData = new FormData();
    formData.append('sender_id', senderId);
    formData.append('receiver_id', receiverId);
    if (filename) formData.append('filename', filename);
    if (filesize) formData.append('filesize', filesize.toString());

    const res = await fetch(`${API_BASE}/network/transfer/initiate`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Mesh transfer failed' }));
      throw new Error(err.detail || 'Mesh transfer failed');
    }
    return res.json();
  },
};

