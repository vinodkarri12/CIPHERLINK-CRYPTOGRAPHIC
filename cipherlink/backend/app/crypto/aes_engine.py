import os
import hashlib
import struct
from typing import Generator, Tuple, Dict, Any, List
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

CHUNK_SIZE = 64 * 1024  # 64 KB chunks for responsive streaming

class AESEngine:
    """
    Production AES-256-GCM Authenticated Encryption Engine:
    - Chunked file streaming with unique 12-byte nonces
    - Cryptographically binds chunk metadata (AAD)
    - 128-bit authentication tag per chunk (integrity & authenticity)
    - Tamper detection and SHA-256 verification
    """

    @staticmethod
    def generate_key() -> bytes:
        """Generate a random 256-bit (32 bytes) AES key."""
        return AESGCM.generate_key(bit_length=256)

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        """Compute SHA-256 hexadecimal hash of bytes."""
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def construct_aad(file_id: str, chunk_index: int, total_chunks: int, is_last: bool) -> bytes:
        """
        Construct Additional Authenticated Data (AAD).
        Prevents chunk reordering, truncation, or substitution attacks across files.
        """
        file_id_bytes = file_id.encode('utf-8')[:32].ljust(32, b'\x00')
        flags = 1 if is_last else 0
        return struct.pack(">32sIIB", file_id_bytes, chunk_index, total_chunks, flags)

    @staticmethod
    def encrypt_chunk(
        key: bytes,
        plaintext_chunk: bytes,
        file_id: str,
        chunk_index: int,
        total_chunks: int,
        is_last: bool,
        base_iv: bytes = None
    ) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypt a single chunk using AES-256-GCM.
        Returns: (ciphertext_chunk, nonce_12b, tag_16b)
        """
        aesgcm = AESGCM(key)
        
        # 12-byte nonce: 8 bytes random base IV + 4 bytes big-endian counter
        if base_iv is None or len(base_iv) != 8:
            base_iv = os.urandom(8)
        
        nonce = base_iv + struct.pack(">I", chunk_index)
        aad = AESEngine.construct_aad(file_id, chunk_index, total_chunks, is_last)
        
        # AESGCM.encrypt in Python cryptography appends the 16-byte tag to the ciphertext
        encrypted_with_tag = aesgcm.encrypt(nonce, plaintext_chunk, aad)
        ciphertext = encrypted_with_tag[:-16]
        tag = encrypted_with_tag[-16:]
        
        return ciphertext, nonce, tag

    @staticmethod
    def decrypt_chunk(
        key: bytes,
        ciphertext_chunk: bytes,
        nonce: bytes,
        tag: bytes,
        file_id: str,
        chunk_index: int,
        total_chunks: int,
        is_last: bool
    ) -> bytes:
        """
        Decrypt and authenticate a chunk.
        Raises InvalidTag if any byte of ciphertext, nonce, tag, or AAD was altered.
        """
        aesgcm = AESGCM(key)
        aad = AESEngine.construct_aad(file_id, chunk_index, total_chunks, is_last)
        encrypted_with_tag = ciphertext_chunk + tag
        
        try:
            plaintext = aesgcm.decrypt(nonce, encrypted_with_tag, aad)
            return plaintext
        except InvalidTag:
            raise ValueError(f"Integrity check failed: Chunk {chunk_index} has been tampered with or corrupted!")

    @staticmethod
    def encrypt_buffer(key: bytes, data: bytes, file_id: str) -> Dict[str, Any]:
        """Encrypt full buffer in chunked form and return serialized package."""
        total_size = len(data)
        total_chunks = max(1, (total_size + CHUNK_SIZE - 1) // CHUNK_SIZE) if total_size > 0 else 1
        base_iv = os.urandom(8)
        original_sha256 = hashlib.sha256(data).hexdigest()
        
        chunks = []
        for i in range(total_chunks):
            start = i * CHUNK_SIZE
            end = min(start + CHUNK_SIZE, total_size)
            chunk_bytes = data[start:end]
            is_last = (i == total_chunks - 1)
            
            ciphertext, nonce, tag = AESEngine.encrypt_chunk(
                key=key,
                plaintext_chunk=chunk_bytes,
                file_id=file_id,
                chunk_index=i,
                total_chunks=total_chunks,
                is_last=is_last,
                base_iv=base_iv
            )
            chunks.append({
                "chunk_index": i,
                "ciphertext_hex": ciphertext.hex(),
                "nonce_hex": nonce.hex(),
                "tag_hex": tag.hex(),
                "is_last": is_last,
                "size": len(ciphertext)
            })
            
        return {
            "file_id": file_id,
            "original_sha256": original_sha256,
            "total_chunks": total_chunks,
            "total_size": total_size,
            "chunks": chunks
        }

    @staticmethod
    def decrypt_buffer(key: bytes, encrypted_payload: Dict[str, Any]) -> Tuple[bytes, bool]:
        """
        Decrypt all chunks, verify authentication tags, and compute SHA-256.
        Returns: (decrypted_bytes, sha256_verified)
        """
        file_id = encrypted_payload["file_id"]
        total_chunks = encrypted_payload["total_chunks"]
        chunks = encrypted_payload["chunks"]
        expected_sha256 = encrypted_payload["original_sha256"]
        
        reassembled = bytearray()
        for chunk_meta in sorted(chunks, key=lambda c: c["chunk_index"]):
            idx = chunk_meta["chunk_index"]
            c_bytes = bytes.fromhex(chunk_meta["ciphertext_hex"])
            nonce = bytes.fromhex(chunk_meta["nonce_hex"])
            tag = bytes.fromhex(chunk_meta["tag_hex"])
            is_last = chunk_meta["is_last"]
            
            p_chunk = AESEngine.decrypt_chunk(
                key=key,
                ciphertext_chunk=c_bytes,
                nonce=nonce,
                tag=tag,
                file_id=file_id,
                chunk_index=idx,
                total_chunks=total_chunks,
                is_last=is_last
            )
            reassembled.extend(p_chunk)
            
        final_bytes = bytes(reassembled)
        actual_sha256 = hashlib.sha256(final_bytes).hexdigest()
        is_valid = (actual_sha256.lower() == expected_sha256.lower())
        return final_bytes, is_valid

    @staticmethod
    def simulate_tamper(key: bytes, encrypted_chunk: Dict[str, Any], file_id: str) -> Dict[str, Any]:
        """
        Deliberately flip a byte in a chunk to demonstrate cryptographic tamper detection.
        Returns detailed results proving GCM tag rejection.
        """
        c_bytes = bytearray(bytes.fromhex(encrypted_chunk["ciphertext_hex"]))
        if len(c_bytes) > 0:
            c_bytes[0] ^= 0xFF  # Flip all bits in the first byte
        nonce = bytes.fromhex(encrypted_chunk["nonce_hex"])
        tag = bytes.fromhex(encrypted_chunk["tag_hex"])
        
        tampered_caught = False
        error_message = ""
        try:
            AESEngine.decrypt_chunk(
                key=key,
                ciphertext_chunk=bytes(c_bytes),
                nonce=nonce,
                tag=tag,
                file_id=file_id,
                chunk_index=encrypted_chunk.get("chunk_index", 0),
                total_chunks=encrypted_chunk.get("total_chunks", 1),
                is_last=encrypted_chunk.get("is_last", True)
            )
        except Exception as e:
            tampered_caught = True
            error_message = str(e)
            
        return {
            "tampered_detected": tampered_caught,
            "error_message": error_message,
            "algorithm": "AES-256-GCM",
            "tag_size_bits": 128,
            "verification_status": "AUTHENTICATION_FAILED_CORRECTLY" if tampered_caught else "SECURITY_VIOLATION"
        }

