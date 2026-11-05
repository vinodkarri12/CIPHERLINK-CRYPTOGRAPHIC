import os
import hashlib
import binascii
from typing import Tuple, Dict, Any, Optional
from cryptography.hazmat.primitives.asymmetric import ec, x25519
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend

class ECCEngine:
    """
    Production-grade Elliptic Curve Cryptography engine providing:
    - SECP256R1 (NIST P-256) and X25519 key generation
    - ECDH (Elliptic Curve Diffie-Hellman) shared secret agreement
    - HKDF-SHA256 deterministic key derivation (RFC 5869)
    - ECDSA digital signatures for peer authentication
    - Educational step-by-step mathematical breakdown
    """

    @staticmethod
    def generate_secp256r1_keypair() -> Tuple[ec.EllipticCurvePrivateKey, ec.EllipticCurvePublicKey]:
        """Generate a NIST P-256 (SECP256R1) ECC private/public keypair."""
        private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
        public_key = private_key.public_key()
        return private_key, public_key

    @staticmethod
    def generate_x25519_keypair() -> Tuple[x25519.X25519PrivateKey, x25519.X25519PublicKey]:
        """Generate a Curve25519 (X25519) keypair for high-speed Diffie-Hellman."""
        private_key = x25519.X25519PrivateKey.generate()
        public_key = private_key.public_key()
        return private_key, public_key

    @staticmethod
    def serialize_public_key(public_key) -> Tuple[str, str, str]:
        """
        Serialize public key to:
        - PEM string
        - Hex raw bytes string
        - SHA-256 Key Fingerprint
        """
        if isinstance(public_key, ec.EllipticCurvePublicKey):
            pem_bytes = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            raw_bytes = public_key.public_bytes(
                encoding=serialization.Encoding.X962,
                format=serialization.PublicFormat.UncompressedPoint
            )
        elif isinstance(public_key, x25519.X25519PublicKey):
            pem_bytes = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            raw_bytes = public_key.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
        else:
            raise ValueError("Unsupported public key type")

        fingerprint = hashlib.sha256(raw_bytes).hexdigest()
        formatted_fp = ":".join(fingerprint[i:i+2] for i in range(0, 32, 2)).upper()
        return pem_bytes.decode('utf-8'), raw_bytes.hex(), formatted_fp

    @staticmethod
    def serialize_private_key(private_key) -> str:
        """Serialize private key to PEM format (for safe internal handling)."""
        pem_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem_bytes.decode('utf-8')

    @staticmethod
    def load_public_key_from_pem(pem_str: str):
        """Parse PEM string into EllipticCurvePublicKey or X25519PublicKey."""
        return serialization.load_pem_public_key(pem_str.encode('utf-8'), backend=default_backend())

    @staticmethod
    def load_private_key_from_pem(pem_str: str):
        """Parse PEM string into PrivateKey."""
        return serialization.load_pem_private_key(pem_str.encode('utf-8'), password=None, backend=default_backend())

    @staticmethod
    def derive_ecdh_shared_secret(private_key, peer_public_key) -> bytes:
        """
        Perform Elliptic Curve Diffie-Hellman (ECDH) key exchange:
        S = d_local * Q_peer
        Returns the raw shared secret bytes.
        """
        if isinstance(private_key, ec.EllipticCurvePrivateKey) and isinstance(peer_public_key, ec.EllipticCurvePublicKey):
            return private_key.exchange(ec.ECDH(), peer_public_key)
        elif isinstance(private_key, x25519.X25519PrivateKey) and isinstance(peer_public_key, x25519.X25519PublicKey):
            return private_key.exchange(peer_public_key)
        else:
            raise TypeError("Mismatched or unsupported key types for ECDH key agreement")

    @staticmethod
    def derive_symmetric_key_hkdf(
        shared_secret: bytes,
        salt: Optional[bytes] = None,
        info: bytes = b"cipherlink-v1-aes256-gcm",
        key_length: int = 32
    ) -> Tuple[bytes, bytes]:
        """
        Derive high-entropy AES-256 key from ECDH shared secret using HKDF-SHA256 (RFC 5869).
        Returns (aes_key_bytes, salt_used).
        """
        if salt is None:
            # Deterministic zero salt or secure random salt
            salt = os.urandom(16)

        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=key_length,
            salt=salt,
            info=info,
            backend=default_backend()
        )
        derived_key = hkdf.derive(shared_secret)
        return derived_key, salt

    @staticmethod
    def sign_message(private_key: ec.EllipticCurvePrivateKey, message: bytes) -> bytes:
        """Generate ECDSA-SHA256 signature for peer identity authentication."""
        return private_key.sign(message, ec.ECDSA(hashes.SHA256()))

    @staticmethod
    def verify_signature(public_key: ec.EllipticCurvePublicKey, signature: bytes, message: bytes) -> bool:
        """Verify ECDSA-SHA256 signature."""
        try:
            public_key.verify(signature, message, ec.ECDSA(hashes.SHA256()))
            return True
        except Exception:
            return False

    @staticmethod
    def mask_key(key_bytes: bytes) -> str:
        """Safe visual representation of a key for UI (never expose raw key)."""
        hex_key = key_bytes.hex()
        return f"{hex_key[:6]}...{hex_key[-6:]} ({len(key_bytes) * 8} bits)"

    @staticmethod
    def get_curve_math_details(curve_name: str = "SECP256R1") -> Dict[str, Any]:
        """Educational mathematical parameters for the interactive visualizer."""
        if curve_name.upper() in ["SECP256R1", "P-256", "NIST-P256"]:
            return {
                "curve_name": "NIST P-256 (SECP256R1)",
                "equation": "y² ≡ x³ + ax + b (mod p)",
                "field_type": "Prime field F_p",
                "key_size_bits": 256,
                "equivalent_rsa_bits": 3072,
                "security_level_bits": 128,
                "parameters": {
                    "p": "0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF (2^256 - 2^224 + 2^192 + 2^96 - 1)",
                    "a": "-3 (mod p)",
                    "b": "0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B",
                    "G_x": "0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296",
                    "G_y": "0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",
                    "order_n": "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551",
                    "cofactor_h": "1"
                },
                "steps": [
                    {
                        "step": 1,
                        "title": "Private Key Generation",
                        "formula": "d ∈ [1, n-1]",
                        "description": "A cryptographically secure random integer d is selected as the private key."
                    },
                    {
                        "step": 2,
                        "title": "Public Key Scalar Multiplication",
                        "formula": "Q = d · G",
                        "description": "Generator point G is added to itself d times using double-and-add algorithm. Discrete Logarithm Problem ensures d cannot be recovered from Q."
                    },
                    {
                        "step": 3,
                        "title": "ECDH Key Agreement",
                        "formula": "S = d_A · Q_B = d_B · Q_A",
                        "description": "Alice multiplies Bob's public key with her private key; Bob does vice versa. Both arrive at the exact same point on the curve."
                    },
                    {
                        "step": 4,
                        "title": "HKDF Key Derivation",
                        "formula": "K = HKDF-Expand(HKDF-Extract(salt, S_x), info, 32)",
                        "description": "The x-coordinate of shared secret S is expanded into a cryptographically uniform 256-bit symmetric AES key."
                    },
                    {
                        "step": 5,
                        "title": "AES-256-GCM Transfer",
                        "formula": "C, T = AES-GCM_{K}(IV, P, AAD)",
                        "description": "High-throughput symmetric authenticated encryption transmits chunked payload with 128-bit authentication tags."
                    }
                ]
            }
        elif curve_name.upper() in ["X25519", "CURVE25519"]:
            return {
                "curve_name": "Curve25519 (X25519)",
                "equation": "v² = u³ + 486662u² + u (mod 2^255 - 19)",
                "field_type": "Montgomery curve over prime field",
                "key_size_bits": 256,
                "equivalent_rsa_bits": 3072,
                "security_level_bits": 128,
                "parameters": {
                    "p": "2^255 - 19",
                    "A": "486662",
                    "B": "1",
                    "base_point_u": "9"
                },
                "steps": [
                    {"step": 1, "title": "Clamping Private Key", "formula": "scalar clamping", "description": "32 random bytes with bits masked to avoid small subgroup attacks."},
                    {"step": 2, "title": "Montgomery Ladder", "formula": "X25519(k, u)", "description": "Constant-time point multiplication immune to cache-timing attacks."},
                    {"step": 3, "title": "Shared Secret", "formula": "S = X25519(k_A, u_B) = X25519(k_B, u_A)", "description": "Both parties reach matching 32-byte shared point."},
                    {"step": 4, "title": "HKDF Key Derivation", "formula": "AES_Key = HKDF(S)", "description": "Generates 256-bit AES master key."},
                    {"step": 5, "title": "AES-256-GCM Encryption", "formula": "Authenticated Streaming", "description": "High-speed encrypted chunk transmission."}
                ]
            }
        else:
            raise ValueError(f"Unknown curve {curve_name}")

