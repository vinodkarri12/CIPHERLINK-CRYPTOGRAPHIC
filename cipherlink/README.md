# 🛡️ CIPHERLINK – Next-Gen Secure File Transfer Platform Using Elliptic Curve Cryptography (ECC)

> **"Your Files. Your Privacy. Your Control."**  
> *A commercial-grade, production-quality cybersecurity web application engineered with Elliptic Curve Cryptography (ECDH), HKDF-SHA256, and AES-256-GCM authenticated chunk streaming.*

---

## 🌟 Executive Overview & Brand Identity

CIPHERLINK is an advanced cybersecurity platform that demonstrates the power of modern **Hybrid Cryptography**. 
Traditional asymmetric systems like RSA suffer from severe computational overhead and ballooning key sizes (3072+ bits for modern security). CIPHERLINK solves this by establishing ephemeral session keys via **Elliptic Curve Diffie-Hellman (ECDH)** in milliseconds, expanding entropy using **HKDF-SHA256**, and streaming bulk file payloads through **AES-256-GCM** with 128-bit authentication tags.

### Key Visual & Technical Highlights:
- **Visual Palette:** Deep Cyber Black (`#050711`), Neon Cyan (`#00E5FF`), Electric Purple (`#8B5CF6`), Glassmorphism panels, subtle glowing borders, and particle neural networks.
- **Cinematic Opening Entry Experience:** 9-stage sequence with digital key exchange, glowing elliptic curve, and animated energy transfer beam.
- **Zero-Knowledge Transport:** Real-time chunked file streaming between browser clients via WebSocket signaling rooms.
- **Genuine Benchmarking Laboratory:** Live CPU performance comparisons across ECC (P-256 / X25519), RSA (2048 / 3072), and AES (128 / 256).
- **Active Tamper Rejection:** Automated rejection of any bit-flipped chunk before decryption execution.
- **Presentation-Ready Documentation:** 13 academic engineering sections tailored for college viva and project evaluations.

---

## 📐 System Architecture & Data Flow

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         SENDER NODE (Alice Browser)                         │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ 1. Drag & drop file / compute SHA-256
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                   EPHEMERAL ECC KEYPAIR (SECP256R1 / X25519)                │
 │       Private scalar: d_A ∈ [1, n-1]   │   Public point: Q_A = d_A · G      │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ 2. Public key exchange over WebSocket
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                   RECEIVER NODE (Bob Browser) KEY AGREEMENT                 │
 │       Private scalar: d_B ∈ [1, n-1]   │   Public point: Q_B = d_B · G      │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
 ┌──────────────────────┐                             ┌──────────────────────┐
 │  S = d_A · Q_B (ECDH)│                             │  S = d_B · Q_A (ECDH)│
 └───────────┬──────────┘                             └───────────┬──────────┘
             ▼                                                     ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                   HKDF-SHA256 KEY EXPANSION (RFC 5869)                    │
 │               K_AES = HKDF-Expand(HKDF-Extract(salt, S_x), info, 32)      │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       ▼ 3. Symmetric 256-bit Key Established
 ┌───────────────────────────────────────────────────────────────────────────┐
 │               CHUNKED AES-256-GCM AUTHENTICATED STREAMING                 │
 │     • Unique 12-byte Nonce per 64 KB chunk (base_iv ^ counter)            │
 │     • Additional Authenticated Data (AAD): file_id || chunk_idx || flags  │
 │     • 128-bit Galois Message Authentication Code (GMAC) tag               │
 └─────────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       ▼ 4. Encrypted chunks streamed to Receiver
 ┌───────────────────────────────────────────────────────────────────────────┐
 │             RECEIVER NODE: AUTHENTICATION & INTEGRITY VERIFICATION        │
 │     • Verify 128-bit GMAC tag per chunk (Instant rejection if tampered)   │
 │     • Reassemble chunks in memory                                         │
 │     • Verify final payload SHA-256 matches manifest checksum              │
 │     • Trigger native browser download of decrypted original file          │
 └───────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Application Structure & Pages

| Page | Name | Core Features |
|---|---|---|
| **Page 1** | **Command Center** | Real-time statistics, encrypted data volume counters, active cipher suite telemetry, live SQLite audit log stream, recent transfer history. |
| **Page 2** | **4-Device Mesh Network** | **NEW:** Multi-device connection dashboard with 4 device slots, animated SVG/canvas topology mesh, pairing codes, isolated pairwise ECDH sessions across all 6 pairs, and simultaneous transfers. |
| **Page 3** | **Secure File Transfer** | Sender Station (drag-and-drop, key generation, encryption, streaming progress) & Receiver Station (room listening, incoming file alert, decryption, SHA-256 verification, download). Includes dual-split loopback test mode and live tamper simulator. |
| **Page 4** | **ECC Encryption Engine** | Interactive Three.js 3D elliptic curve visualizer ($y^2 = x^3 - 3x + b$), 6-step cryptographic pipeline inspector, and mathematical parameters. |
| **Page 5** | **Algorithm Comparison Lab** | Live CPU hardware benchmarks comparing ECC (P-256 / X25519), RSA (2048 / 3072), and AES (128 / 256). Interactive bar charts and throughput measurements across 1MB–500MB payloads. |
| **Page 6** | **Security Center** | Security posture indicators, cipher suite validation, interactive bit-flip tamper injection laboratory, and immutable audit logs. |
| **Page 7** | **Project Information** | Complete 13 academic presentation sections: Introduction, Problem Statement, Existing System, Proposed System, Architecture, Methodology, Technologies, Advantages, Applications, Limitations, Future Scope, Conclusion. |
| **Page 8** | **Documentation & FAQ** | Educational guides on symmetric vs asymmetric ciphers, ECC algebra, AES-GCM mechanics, ECDH, digital signatures, and interactive FAQ accordion. |

---

## 🛰️ 4-Device Multi-Device Network Upgrade

CIPHERLINK now includes a fully functional 4-device mesh network coordinator that supports four simultaneous connected devices:

### 1. Four Device Slots:
* **Device 1 (DEV-1):** Alpha Station (`192.168.1.101`) • Command HQ Terminal • Pairing: `PAIR-ALPHA-901`
* **Device 2 (DEV-2):** Beta Node (`192.168.1.102`) • Mobile Tactical Field Unit • Pairing: `PAIR-BETA-412`
* **Device 3 (DEV-3):** Gamma Vault (`192.168.1.103`) • Datacenter Storage Node • Pairing: `PAIR-GAMMA-733`
* **Device 4 (DEV-4):** Delta Recon (`192.168.1.104`) • Field Surveillance Drone • Pairing: `PAIR-DELTA-855`

### 2. Complete 6-Pair Bidirectional Mesh:
Supports all 6 combinations with dedicated pairwise ECDH session keys:
1. `DEV-1` ↔ `DEV-2`
2. `DEV-1` ↔ `DEV-3`
3. `DEV-1` ↔ `DEV-4`
4. `DEV-2` ↔ `DEV-3`
5. `DEV-2` ↔ `DEV-4`
6. `DEV-3` ↔ `DEV-4`

### 3. Key Upgraded Capabilities:
* **Interactive Mesh Topology Visualizer:** An animated SVG/Canvas network displaying nodes, active status badges, and animated data packet streams along active links.
* **Mutual Pairing Authorization:** Devices pair using secret codes. Unpaired communication attempts are strictly rejected and logged as `CRITICAL` in SQLite security audit logs.
* **Simultaneous File Transfers:** Multiple independent transfers can run concurrently (e.g. `DEV-1` transferring to `DEV-2` while `DEV-3` transfers to `DEV-4` at the same time).
* **End-to-End Cryptographic Isolation:** Every device generates its own private key. Pairwise session keys are derived via $ECDH(priv_A, pub_B)$ and HKDF-SHA256. Unrelated devices cannot decrypt relayed traffic.

---

## ⚡ Quickstart & Running Instructions

### 1. Prerequisites
- **Python:** 3.10+ (Python 3.13 tested)
- **Node.js:** v18+ (Node.js v24 tested) & npm

### 2. Backend Setup & Startup
```powershell
cd c:\Users\vinod\python\cipherlink\backend

# Install dependencies (if not already installed)
python -m pip install -r ../requirements.txt

# Run automated cryptography unit tests
python -m pytest tests

# Start FastAPI Gateway & WebSocket server on http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup & Startup
```powershell
cd c:\Users\vinod\python\cipherlink\frontend

# Install dependencies
npm install

# Start Vite live development server on http://localhost:5173
npm run dev

# Or build for production
npm run build
```

> **Single-Server Note:** The FastAPI backend is configured to automatically serve the compiled frontend production bundle from `frontend/dist`. Opening `http://localhost:8000` serves the entire web application and API simultaneously!

---

## 🧪 Automated Testing Verification

The backend includes a comprehensive automated test suite verifying all mathematical and cryptographic components:
- `test_ecc_keypair_generation`: NIST P-256 & Curve25519 key generation & fingerprints.
- `test_ecdh_shared_secret_agreement`: Proves Alice and Bob compute exact identical shared points.
- `test_hkdf_key_derivation`: Validates 256-bit symmetric key expansion with salt.
- `test_ecdsa_digital_signatures`: Peer authentication and signature verification.
- `test_aes_chunked_encryption_and_decryption`: Byte-perfect file recovery.
- `test_tamper_detection_gcm`: Proves single-bit ciphertext modification is rejected by GMAC.
- `test_benchmarks_live_execution`: Validates real hardware timing measurements.
- `test_database_and_stats`: Validates SQLite persistence and telemetry queries.

Run tests anytime:
```powershell
cd c:\Users\vinod\python\cipherlink\backend
python -m pytest tests
```

---

## 🛡️ Academic Viva & Interview Cheat Sheet

- **Q: Why does 256-bit ECC equal 3072-bit RSA?**  
  *A:* The best known classical attack against RSA (General Number Field Sieve) runs in sub-exponential time. Pollard's rho against ECDLP runs in full exponential time $O(\sqrt{n})$. A 256-bit curve requires $2^{128}$ operations to solve, identical to a 3072-bit RSA modulus.
- **Q: What is the benefit of Galois Counter Mode (GCM)?**  
  *A:* GCM is an AEAD (Authenticated Encryption with Associated Data) mode that provides confidentiality, integrity, and authenticity in a single parallelizable pass, utilizing GHASH multiplication over $GF(2^{128})$.
- **Q: How does CIPHERLINK prevent Man-in-the-Middle (MitM) attacks?**  
  *A:* Peer identity public keys are authenticated with digital signatures, session keys are bound to cryptographic nonces and AAD metadata, and all signalling runs over authenticated channels.

