# 🛡️ CIPHERLINK – Next-Gen Secure File Transfer Platform Using Elliptic Curve Cryptography (ECC)

> **"Your Files. Your Privacy. Your Control."**  
> *A commercial-grade cybersecurity web application engineered with Elliptic Curve Cryptography (ECDH), HKDF-SHA256, and AES-256-GCM authenticated chunk streaming.*

🌐 **Live Web Application (GitHub Pages):**  
👉 **[https://vinodkarri12.github.io/CIPHERLINK-CRYPTOGRAPHIC/](https://vinodkarri12.github.io/CIPHERLINK-CRYPTOGRAPHIC/)**

---

## 🌟 Executive Overview & Brand Identity

CIPHERLINK is an advanced cybersecurity platform that demonstrates the power of modern **Hybrid Cryptography**. 
Traditional asymmetric systems like RSA suffer from severe computational overhead and ballooning key sizes (3072+ bits for modern security). CIPHERLINK solves this by establishing ephemeral session keys via **Elliptic Curve Diffie-Hellman (ECDH)** in milliseconds, expanding entropy using **HKDF-SHA256**, and streaming bulk file payloads through **AES-256-GCM** with 128-bit Galois Message Authentication Code (GMAC) tags.

### Key Visual & Technical Highlights:
- **Visual Palette:** Deep Cyber Black (`#050711`), Neon Cyan (`#00E5FF`), Electric Purple (`#8B5CF6`), Glassmorphism panels, subtle glowing borders, and particle neural networks.
- **Cinematic Opening Entry Experience:** 9-stage sequence with digital key exchange, glowing elliptic curve, and animated energy transfer beam.
- **Strict 3-Step Cryptographic Flow:**
  1. `Generate ECC Keys` (SECP256R1 / Curve25519)
  2. `Establish Connection` (ECDH key agreement + HKDF-SHA256 derivation)
  3. `Encrypt and Send` (AES-256-GCM authenticated chunk streaming)
- **4-Device Mesh Network:** Pairwise ECDH sessions, real-time presence indicators, and independent simultaneous file transfers across all six device pairs.
- **Zero-Knowledge Transport:** Real-time chunked file streaming with unique 96-bit nonces per chunk.
- **Genuine Benchmarking Laboratory:** Live CPU performance comparisons across ECC (P-256 / X25519), RSA (2048 / 3072), and AES (128 / 256).
- **Active Tamper Rejection:** Simulated bit-flip detection rejecting compromised ciphertexts prior to decryption.
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
 └──────────────────────────────────────┬────────────────────────────────────┘
                                        │ 3. Derived symmetric 256-bit key
                                        ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │                   AES-256-GCM AUTHENTICATED CHUNK STREAM                  │
 │       Ciphertext_i, Tag_i = AES_GCM(K_AES, Nonce_i, Chunk_i, AAD_i)       │
 └───────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment

### Frontend (GitHub Pages)
The frontend is built with React 18, TypeScript, and Vite, configured with base path `/CIPHERLINK-CRYPTOGRAPHIC/`.

- Automated CI/CD is configured in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
- Whenever changes are pushed to `main`, GitHub Actions automatically builds the production bundle and publishes the `dist` folder to GitHub Pages.

#### Enabling GitHub Pages in GitHub:
1. In the repository, go to **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. The site will be live at:  
   👉 **[https://vinodkarri12.github.io/CIPHERLINK-CRYPTOGRAPHIC/](https://vinodkarri12.github.io/CIPHERLINK-CRYPTOGRAPHIC/)**

### Backend (Python FastAPI)
The Python FastAPI backend handles hardware-accelerated cryptographic operations and multi-device coordination. See [**`cipherlink/BACKEND_DEPLOYMENT.md`**](cipherlink/BACKEND_DEPLOYMENT.md) for full instructions on deploying to **Render**, **Railway**, or **Docker/Cloud Run**.

---

## 💻 Local Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/vinodkarri12/CIPHERLINK-CRYPTOGRAPHIC.git
cd CIPHERLINK-CRYPTOGRAPHIC
```

### 2. Start the FastAPI Backend
```bash
cd cipherlink/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Start the Vite Frontend
```bash
cd cipherlink/frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛡️ Security Guarantees & Cryptographic Primitives

| Component | Specification | Security Margin |
| :--- | :--- | :--- |
| **Asymmetric Curve** | NIST P-256 (SECP256R1) / Curve25519 | 128-bit Symmetric Equivalence (ECDLP) |
| **Key Exchange** | Ephemeral ECDH (Diffie-Hellman) | Perfect Forward Secrecy (PFS) |
| **Key Derivation** | HKDF-SHA256 (RFC 5869) | Extract-and-Expand with SHA-256 HMAC |
| **Symmetric Encryption** | AES-256-GCM (Galois/Counter Mode) | Hardware accelerated (AES-NI) |
| **Integrity / Auth** | 128-bit GMAC Authentication Tag | Detects bit-flips and MITM tampering |
| **Chunking Architecture** | 64 KB Authenticated Chunks | Unique 96-bit Nonce per chunk |
| **File Verification** | SHA-256 Pre/Post Verification | Cryptographic assurance of byte-perfection |

---

## 👥 Authors & License

Developed with precision for high-security enterprise and academic evaluation.  
Licensed under the **MIT License**.

