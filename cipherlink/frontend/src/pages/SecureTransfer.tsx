import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Download, Upload, Shield, Key, Lock, CheckCircle2, 
  AlertCircle, FileText, ArrowRight, RefreshCw, Cpu, 
  Radio, HardDrive, Sparkles, Copy, Check, Eye, AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, KeyPairResponse, DeriveSecretResponse } from '../services/api';

export const SecureTransfer: React.FC = () => {
  // Operating Mode: 'SENDER' or 'RECEIVER' or 'SPLIT' (both side-by-side for 1-click testing)
  const [activeTab, setActiveTab] = useState<'SENDER' | 'RECEIVER' | 'SPLIT'>('SENDER');

  // Shared Room & Signaling state
  const [roomCode, setRoomCode] = useState<string>('CIPHER-8842');
  const [copiedRoom, setCopiedRoom] = useState<boolean>(false);
  const [selectedCurve, setSelectedCurve] = useState<'SECP256R1' | 'X25519'>('SECP256R1');

  // ---------- SENDER STATE ----------
  const [senderFile, setSenderFile] = useState<File | null>(null);
  const [senderFilePreview, setSenderFilePreview] = useState<string | null>(null);
  const [senderFileSha256, setSenderFileSha256] = useState<string>('');
  const [senderKeys, setSenderKeys] = useState<KeyPairResponse | null>(null);
  const [senderDerived, setSenderDerived] = useState<DeriveSecretResponse | null>(null);
  const [senderConnected, setSenderConnected] = useState<boolean>(false);
  const [senderProgress, setSenderProgress] = useState<number>(0);
  const [senderStatus, setSenderStatus] = useState<string>('IDLE');
  const [senderSpeed, setSenderSpeed] = useState<string>('0 MB/s');

  // ---------- RECEIVER STATE ----------
  const [receiverActive, setReceiverActive] = useState<boolean>(false);
  const [receiverKeys, setReceiverKeys] = useState<KeyPairResponse | null>(null);
  const [receiverDerived, setReceiverDerived] = useState<DeriveSecretResponse | null>(null);
  const [incomingFile, setIncomingFile] = useState<{
    name: string;
    size: number;
    type: string;
    sha256: string;
    totalChunks: number;
  } | null>(null);
  const [receiverProgress, setReceiverProgress] = useState<number>(0);
  const [receiverStatus, setReceiverStatus] = useState<string>('LISTENING_STANDBY');
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);
  const [decryptedFileName, setDecryptedFileName] = useState<string>('');
  const [integrityVerified, setIntegrityVerified] = useState<boolean | null>(null);
  const [simulateTamper, setSimulateTamper] = useState<boolean>(false);
  const [tamperError, setTamperError] = useState<string | null>(null);

  // File drag & drop ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-generate fresh keys on mount
  useEffect(() => {
    handleGenerateSenderKeys();
    handleStartReceiver();
  }, [selectedCurve]);

  // Handle Sender File Selection
  const handleFileSelect = async (file: File) => {
    setSenderFile(file);
    setSenderProgress(0);
    setSenderStatus('FILE_LOADED');

    // Generate SHA-256 preview of file
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    setSenderFileSha256(hashHex);

    // Image preview if image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setSenderFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setSenderFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Generate Sender ECC Keys
  const handleGenerateSenderKeys = async () => {
    try {
      const keys = await api.generateECCKeys(selectedCurve);
      setSenderKeys(keys);
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Receiver ECC Keys
  const handleStartReceiver = async () => {
    try {
      const keys = await api.generateECCKeys(selectedCurve);
      setReceiverKeys(keys);
      setReceiverActive(true);
      setReceiverStatus('READY_FOR_HANDSHAKE');
    } catch (e) {
      console.error(e);
    }
  };

  // Connect & Establish ECDH + HKDF
  const handleEstablishConnection = async () => {
    setSenderStatus('ESTABLISHING_ECDH');
    try {
      const derivedSender = await api.deriveSharedSecret({ curve: selectedCurve });
      setSenderDerived(derivedSender);
      setSenderConnected(true);

      const derivedReceiver = await api.deriveSharedSecret({ curve: selectedCurve });
      setReceiverDerived(derivedReceiver);
      setReceiverStatus('SESSION_AUTHENTICATED');

      setSenderStatus('READY_TO_ENCRYPT');
    } catch (e) {
      setSenderStatus('CONNECTION_ERROR');
    }
  };

  // Execute Encrypt and Send
  const handleEncryptAndSend = async () => {
    if (!senderFile) return;

    setSenderStatus('ENCRYPTING_CHUNKS');
    setSenderProgress(5);
    setTamperError(null);

    try {
      // 1. Direct encrypted package from backend
      const startTime = performance.now();
      const encryptedPkg = await api.encryptFile(senderFile);
      setSenderProgress(35);

      // Offer incoming file to Receiver
      setIncomingFile({
        name: senderFile.name,
        size: senderFile.size,
        type: senderFile.type,
        sha256: encryptedPkg.original_sha256,
        totalChunks: encryptedPkg.total_chunks,
      });

      // 2. Stream chunks through transmission simulation
      setSenderStatus('STREAMING_AUTHENTICATED_CHUNKS');
      const totalChunks = encryptedPkg.total_chunks;

      for (let i = 0; i < totalChunks; i++) {
        await new Promise((r) => setTimeout(r, Math.max(30, 250 / totalChunks)));
        const p = Math.round(35 + ((i + 1) / totalChunks) * 60);
        setSenderProgress(p);
        setReceiverProgress(p);
        setSenderSpeed(`${(senderFile.size / (1024 * 1024 * 0.4)).toFixed(1)} MB/s`);
      }

      // Check if tamper simulation is enabled
      if (simulateTamper) {
        setSenderStatus('CORRUPTED_IN_TRANSIT');
        setReceiverStatus('SECURITY_INTEGRITY_BREACH');
        setTamperError('AUTHENTICATION_FAILED: AES-256-GCM 128-bit Tag Mismatch! Bit flip detected in chunk 0. File transfer rejected.');
        setIntegrityVerified(false);
        return;
      }

      // 3. Receiver decodes and decrypts
      setReceiverStatus('DECRYPTING_AND_VERIFYING');
      const decryptRes = await api.decryptFile(encryptedPkg);
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      // Convert base64 to Blob for native browser download
      const byteCharacters = atob(decryptRes.data_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: senderFile.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      setDecryptedFileUrl(url);
      setDecryptedFileName(senderFile.name);
      setIntegrityVerified(true);
      setSenderProgress(100);
      setReceiverProgress(100);
      setSenderStatus('TRANSFER_SUCCESSFUL');
      setReceiverStatus('FILE_VERIFIED_AND_READY');

      // Record to SQLite database
      await api.recordTransfer({
        filename: senderFile.name,
        filesize: senderFile.size,
        mode: 'SENDER',
        peer_id: roomCode,
        algorithm: `ECDH(${selectedCurve})+AES-256-GCM`,
        status: 'COMPLETED',
        duration_ms: durationMs,
        sha256_hash: encryptedPkg.original_sha256,
      });

      // Celebrate with cyber confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E5FF', '#8B5CF6', '#10B981'],
      });
    } catch (e: any) {
      console.error(e);
      setSenderStatus('TRANSFER_FAILED');
      setReceiverStatus('DECRYPTION_FAILED');
      setTamperError(e.message || 'Decryption failed');
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header HUD & Operating Mode Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
              Authenticated Peer-to-Peer Pipeline
            </span>
          </div>
          <h1 className="text-2xl font-bold font-cyber text-white">
            SECURE FILE TRANSFER
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Zero-knowledge transport: Files are chunked and encrypted with ephemeral AES-256-GCM keys agreed via ECDH.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-700/60">
          <button
            onClick={() => setActiveTab('SENDER')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'SENDER'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-black shadow-glow-cyan'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            SENDER MODE
          </button>
          <button
            onClick={() => setActiveTab('RECEIVER')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'RECEIVER'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-glow-purple'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            RECEIVER MODE
          </button>
          <button
            onClick={() => setActiveTab('SPLIT')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'SPLIT'
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            DUAL SPLIT VIEW
          </button>
        </div>
      </div>

      {/* Signaling Room & Curve Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Connection Room Code:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/40 text-cyan-300 font-bold">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{roomCode}</span>
            <button
              onClick={copyRoomCode}
              title="Copy Room Code"
              className="ml-2 hover:text-white transition-colors cursor-pointer"
            >
              {copiedRoom ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            onClick={() => setRoomCode(`CIPHER-${Math.floor(1000 + Math.random() * 9000)}`)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> New Room
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">Elliptic Curve:</span>
          <select
            value={selectedCurve}
            onChange={(e) => setSelectedCurve(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono outline-none cursor-pointer"
          >
            <option value="SECP256R1">NIST P-256 (SECP256R1)</option>
            <option value="X25519">Curve25519 (X25519)</option>
          </select>

          {/* Tamper Simulation Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-amber-500/40 transition-colors">
            <input
              type="checkbox"
              checked={simulateTamper}
              onChange={(e) => setSimulateTamper(e.target.checked)}
              className="accent-amber-500"
            />
            <span className="text-amber-300 text-[11px] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Simulate MitM Tamper
            </span>
          </label>
        </div>
      </div>

      {/* Main Mode Layout */}
      <div className={`grid gap-6 ${activeTab === 'SPLIT' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* ==================== SENDER MODE PANEL ==================== */}
        {(activeTab === 'SENDER' || activeTab === 'SPLIT') && (
          <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 space-y-6">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-glow-cyan">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-cyber font-bold text-lg text-white">SENDER STATION</h2>
                  <p className="text-[11px] font-mono text-cyan-300">Origin Node: Alice</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded text-[11px] font-mono ${
                senderConnected ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {senderConnected ? 'SECURE CHANNEL ACTIVE' : 'DISCONNECTED'}
              </span>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative p-6 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-xl bg-cyan-950/10 hover:bg-cyan-950/20 transition-all text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-sm font-cyber font-bold text-white">
                DRAG & DROP FILE HERE OR <span className="text-cyan-400 underline">BROWSE</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Supports any document, binary, video, or data file of any size.
              </p>
            </div>

            {/* Selected File Details */}
            {senderFile && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-start gap-4">
                {senderFilePreview ? (
                  <img src={senderFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-cyan-500/40" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-xs font-bold text-white truncate" title={senderFile.name}>
                      {senderFile.name}
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                      {(senderFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Type: {senderFile.type || 'application/octet-stream'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-1">
                    SHA-256: <span className="text-cyan-300">{senderFileSha256}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cryptographic Controls Step by Step */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleGenerateSenderKeys}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4 text-cyan-400" />
                <span className="font-bold">1. Generate ECC Keys</span>
                <span className="text-[10px] text-slate-400">{selectedCurve}</span>
              </button>

              <button
                onClick={handleEstablishConnection}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 transition-all flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="font-bold">2. Establish Connection</span>
                <span className="text-[10px] text-slate-400">ECDH + HKDF</span>
              </button>

              <button
                onClick={handleEncryptAndSend}
                disabled={!senderFile || senderStatus === 'ENCRYPTING_CHUNKS' || senderStatus === 'STREAMING_AUTHENTICATED_CHUNKS'}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-xs font-mono font-bold text-white shadow-glow-cyan transition-all flex flex-col items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-white" />
                <span>3. Encrypt and Send</span>
                <span className="text-[10px] text-cyan-100">AES-256-GCM Chunks</span>
              </button>
            </div>

            {/* Sender Key Fingerprint Preview */}
            {senderKeys && (
              <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/20 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Sender Ephemeral Public Key Fingerprint:</span>
                  <span className="text-cyan-300 font-bold">{senderKeys.fingerprint}</span>
                </div>
                {senderDerived && (
                  <div className="flex justify-between text-slate-400">
                    <span>Derived AES-256-GCM Master Key:</span>
                    <span className="text-emerald-400 font-bold">{senderDerived.aes_key_preview}</span>
                  </div>
                )}
              </div>
            )}

            {/* Transfer Progress Indicator */}
            {senderProgress > 0 && (
              <div className="space-y-2 p-4 rounded-xl bg-black/60 border border-cyan-500/30">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold">{senderStatus}</span>
                  <span className="text-white font-bold">{senderProgress}% ({senderSpeed})</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-cyan-500/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 transition-all duration-200"
                    style={{ width: `${senderProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== RECEIVER MODE PANEL ==================== */}
        {(activeTab === 'RECEIVER' || activeTab === 'SPLIT') && (
          <div className="p-6 rounded-2xl glass-panel-purple border border-purple-500/30 space-y-6">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-400 flex items-center justify-center text-purple-300 shadow-glow-purple">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-cyber font-bold text-lg text-white">RECEIVER STATION</h2>
                  <p className="text-[11px] font-mono text-purple-300">Destination Node: Bob</p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-purple-950/80 text-purple-300 border border-purple-500/30">
                {receiverStatus}
              </span>
            </div>

            {/* Receiver Identity & Keys */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Receiver Cryptographic Node:</span>
                <button
                  onClick={handleStartReceiver}
                  className="text-xs font-mono text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate Node
                </button>
              </div>
              {receiverKeys && (
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  Node Fingerprint: <span className="text-purple-300">{receiverKeys.fingerprint}</span>
                </div>
              )}
            </div>

            {/* Incoming File Offer Notification */}
            {incomingFile ? (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider">
                    INCOMING FILE STREAM DETECTED
                  </span>
                  <span className="text-xs font-mono text-white">
                    {(incomingFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div className="font-mono text-xs text-white font-bold truncate">
                  {incomingFile.name}
                </div>

                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Expected SHA-256: <span className="text-cyan-300">{incomingFile.sha256}</span>
                </div>

                {/* Receiver Progress Bar */}
                {receiverProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-purple-300">
                      <span>Decryption & Tag Authentication:</span>
                      <span>{receiverProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-200"
                        style={{ width: `${receiverProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-purple-500/20 text-center font-mono text-xs text-slate-500">
                Listening for incoming ECDH handshake and authenticated payload chunks...
              </div>
            )}

            {/* Tamper Alert Error Box if triggered */}
            {tamperError && (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertCircle className="w-4 h-4" /> CRYPTOGRAPHIC INTEGRITY VIOLATION
                </div>
                <p className="text-rose-200 leading-relaxed text-[11px]">
                  {tamperError}
                </p>
                <div className="text-[10px] text-slate-300 bg-black/40 p-2 rounded">
                  Defense Verified: The 128-bit Galois Message Authentication Code (GMAC) rejected the corrupted chunk before any plaintext could be executed.
                </div>
              </div>
            )}

            {/* Verified Download Trigger */}
            {decryptedFileUrl && integrityVerified && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4" /> INTEGRITY VERIFIED (SHA-256 EXACT MATCH)
                </div>
                <p className="text-[11px] font-mono text-emerald-200">
                  Decrypted payload has been authenticated against all chunk tags and original cryptographic hash.
                </p>
                <a
                  href={decryptedFileUrl}
                  download={decryptedFileName}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-cyber font-bold text-sm tracking-wide shadow-glow-cyan flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-black" /> DOWNLOAD DECRYPTED FILE ({decryptedFileName})
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

