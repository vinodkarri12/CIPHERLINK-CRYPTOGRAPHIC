import React, { useState, useEffect } from 'react';
import { 
  Network, Send, Download, Shield, Key, Lock, Radio, 
  CheckCircle2, AlertCircle, RefreshCw, Smartphone, Laptop, 
  Server, Plane, Play, Copy, Check, Link2, Unlink, FileText, 
  Layers, ArrowRight, Zap 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NetworkMeshVisualizer } from '../animations/NetworkMeshVisualizer';
import { 
  api, DeviceSlotModel, PairwiseSessionModel, MultiDeviceTransferEvent, MultiDeviceNetworkState 
} from '../services/api';

export const FourDeviceNetwork: React.FC = () => {
  const [networkState, setNetworkState] = useState<MultiDeviceNetworkState | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string>('DEV-1');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Send File Modal State
  const [sendModalOpen, setSendModalOpen] = useState<boolean>(false);
  const [senderDevice, setSenderDevice] = useState<string>('DEV-1');
  const [receiverDevice, setReceiverDevice] = useState<string>('DEV-2');
  const [fileToTransfer, setFileToTransfer] = useState<File | null>(null);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [latestDecryptedDownload, setLatestDecryptedDownload] = useState<{
    receiver: string;
    filename: string;
    url: string;
    sha256: string;
  } | null>(null);

  // Pairing Modal State
  const [pairModalOpen, setPairModalOpen] = useState<boolean>(false);
  const [pairInitiator, setPairInitiator] = useState<string>('DEV-1');
  const [pairTarget, setPairTarget] = useState<string>('DEV-4');
  const [pairCodeInput, setPairCodeInput] = useState<string>('');
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairSuccess, setPairSuccess] = useState<string | null>(null);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchMeshState = async () => {
    try {
      const state = await api.getMeshState();
      setNetworkState(state);
    } catch (e) {
      console.error('Failed to fetch mesh state:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeshState();
    const interval = setInterval(fetchMeshState, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchMeshState();
  };

  const handleToggleOnline = async (deviceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'OFFLINE' ? 'ONLINE' : 'OFFLINE';
    try {
      await api.setDeviceStatus(deviceId, nextStatus);
      await fetchMeshState();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Send File modal from specific card
  const openSendModal = (fromDevice: string) => {
    setSenderDevice(fromDevice);
    // Pick the first available authorized peer
    const slot = networkState?.devices.find((d) => d.device_id === fromDevice);
    const peer = slot?.authorized_peers[0] || (fromDevice === 'DEV-1' ? 'DEV-2' : 'DEV-1');
    setReceiverDevice(peer);
    setTransferError(null);
    setSendModalOpen(true);
  };

  // Execute Pair Action
  const handleExecutePairing = async () => {
    setPairError(null);
    setPairSuccess(null);
    try {
      const res = await api.pairMeshDevices(pairInitiator, pairTarget, pairCodeInput);
      setPairSuccess(res.message);
      await fetchMeshState();
      setTimeout(() => {
        setPairModalOpen(false);
        setPairSuccess(null);
        setPairCodeInput('');
      }, 1500);
    } catch (err: any) {
      setPairError(err.message || 'Authentication failed');
    }
  };

  // Execute Unpair Action
  const handleExecuteUnpair = async (devA: string, devB: string) => {
    try {
      await api.unpairMeshDevices(devA, devB);
      await fetchMeshState();
    } catch (e) {
      console.error(e);
    }
  };

  // Execute Transfer
  const handleExecuteTransfer = async () => {
    setTransferring(true);
    setTransferError(null);

    try {
      const fileName = fileToTransfer ? fileToTransfer.name : 'recon_telemetry_v4.dat';
      const fileSize = fileToTransfer ? fileToTransfer.size : 2097152;

      const res = await api.initiateMeshTransfer(senderDevice, receiverDevice, fileName, fileSize);

      // Create download blob if base64 provided
      if (res.decrypted_base64) {
        const byteCharacters = atob(res.decrypted_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        setLatestDecryptedDownload({
          receiver: receiverDevice,
          filename: fileName,
          url: url,
          sha256: res.sha256_hash,
        });
      }

      await fetchMeshState();
      setSendModalOpen(false);
      setFileToTransfer(null);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00E5FF', '#8B5CF6', '#10B981'],
      });
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  // Launch Simultaneous Multi-Transfer Test (D1->D2 and D3->D4 at the exact same time)
  const handleSimultaneousTest = async () => {
    setTransferring(true);
    try {
      // Fire two independent transfers concurrently
      await Promise.all([
        api.initiateMeshTransfer('DEV-1', 'DEV-2', 'alpha_briefing.pdf', 1048576).catch((e) => console.error(e)),
        api.initiateMeshTransfer('DEV-3', 'DEV-4', 'vault_snapshot.bin', 4194304).catch((e) => console.error(e)),
      ]);

      await fetchMeshState();

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#00E5FF', '#8B5CF6', '#F59E0B'],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTransferring(false);
    }
  };

  // Set of authorized pair keys "DEV-A_DEV-B" (with dev_a < dev_b)
  const authorizedPairsSet = new Set<string>();
  networkState?.active_pairwise_sessions.forEach((s) => {
    const min = s.device_a < s.device_b ? s.device_a : s.device_b;
    const max = s.device_a > s.device_b ? s.device_a : s.device_b;
    authorizedPairsSet.add(`${min}_${max}`);
  });

  const getDeviceIcon = (deviceId: string) => {
    switch (deviceId) {
      case 'DEV-1': return <Laptop className="w-5 h-5 text-cyan-400" />;
      case 'DEV-2': return <Smartphone className="w-5 h-5 text-purple-400" />;
      case 'DEV-3': return <Server className="w-5 h-5 text-emerald-400" />;
      case 'DEV-4': return <Plane className="w-5 h-5 text-amber-400" />;
      default: return <Radio className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header HUD */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
              Multi-Device Cryptographic Mesh • 4 Node Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cyber tracking-wide text-white">
            FOUR-DEVICE CONNECTION DASHBOARD
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1 max-w-2xl">
            Simultaneous multi-client file transfer coordination. Each device slot maintains private ECC scalars, 
            unique pairing credentials, and isolated pairwise <strong>AES-256-GCM</strong> sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Mesh
          </button>

          <button
            onClick={() => setPairModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-mono text-purple-200 transition-all cursor-pointer shadow-glow-purple"
          >
            <Link2 className="w-4 h-4 text-purple-400" /> Device Pairing
          </button>

          <button
            onClick={handleSimultaneousTest}
            disabled={transferring}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-mono font-bold text-white shadow-glow-cyan transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Simultaneous Transfer Test (D1→D2 & D3→D4)
          </button>
        </div>
      </div>

      {/* Network Topology Visualizer */}
      {networkState && (
        <NetworkMeshVisualizer
          devices={networkState.devices}
          activeTransfers={networkState.active_transfers}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
          authorizedPairs={authorizedPairsSet}
        />
      )}

      {/* Four Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {networkState?.devices.map((device) => {
          const isSelected = selectedDevice === device.device_id;
          const isOnline = device.status !== 'OFFLINE';
          const isTransferring = device.status === 'TRANSFERRING';

          return (
            <div
              key={device.device_id}
              onClick={() => setSelectedDevice(device.device_id)}
              className={`p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'glass-panel-glow border-2 border-cyan-400 shadow-glow-cyan'
                  : 'glass-panel border border-cyan-500/20 hover:border-cyan-500/40'
              }`}
            >
              <div className="space-y-3">
                {/* Device Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center">
                      {getDeviceIcon(device.device_id)}
                    </div>
                    <div>
                      <h3 className="font-cyber font-bold text-sm text-white leading-tight">
                        {device.name}
                      </h3>
                      <span className="text-[10px] font-mono text-cyan-300">
                        {device.role_type}
                      </span>
                    </div>
                  </div>

                  {/* Online/Offline Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOnline(device.device_id, device.status);
                    }}
                    title="Toggle Device Online/Offline Status"
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      isTransferring
                        ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400 animate-pulse'
                        : isOnline
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {device.status}
                  </button>
                </div>

                {/* Device Specifications */}
                <div className="p-3 rounded-xl bg-black/50 border border-slate-800 text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Device ID:</span>
                    <span className="text-cyan-300 font-bold">{device.device_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="text-slate-200">{device.ip_address}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pairing Code:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-purple-300 font-bold">{device.pairing_code}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(device.pairing_code);
                        }}
                        className="hover:text-white transition-colors cursor-pointer"
                        title="Copy Pairing Code"
                      >
                        {copiedCode === device.pairing_code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connected Time:</span>
                    <span className="text-slate-300">{device.connected_since || 'Offline'}</span>
                  </div>
                </div>

                {/* Authorized Paired Peers List */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Authorized Paired Nodes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {device.authorized_peers.length > 0 ? (
                      device.authorized_peers.map((peerId) => (
                        <span
                          key={peerId}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1"
                        >
                          <Link2 className="w-2.5 h-2.5" /> {peerId}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 italic">
                        No paired devices yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Receive Status Info */}
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Receive Status:</span>
                  <span className={isTransferring ? 'text-cyan-300 font-bold animate-pulse' : 'text-slate-400'}>
                    {isTransferring ? 'RECEIVING ENCRYPTED CHUNKS' : 'STANDBY READY'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openSendModal(device.device_id);
                  }}
                  disabled={!isOnline}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-xs font-mono font-bold text-white shadow-glow-cyan transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Send File
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verified Download Notice Banner if Available */}
      {latestDecryptedDownload && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                DECRYPTED FILE READY AT {latestDecryptedDownload.receiver}
              </div>
              <div className="text-sm font-cyber font-bold text-white">
                {latestDecryptedDownload.filename}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate max-w-md">
                SHA-256 Digest: <span className="text-cyan-300">{latestDecryptedDownload.sha256}</span>
              </div>
            </div>
          </div>

          <a
            href={latestDecryptedDownload.url}
            download={latestDecryptedDownload.filename}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-cyber font-bold text-xs tracking-wider shadow-glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-black" /> DOWNLOAD RESTORED ORIGINAL
          </a>
        </div>
      )}

      {/* Active Multi-Transfer Telemetry Feed */}
      <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="font-cyber font-bold text-lg text-white">
              SIMULTANEOUS MULTI-DEVICE TRANSFERS
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-time pairwise ECDH + AES-256-GCM streaming
          </span>
        </div>

        {networkState && networkState.active_transfers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {networkState.active_transfers.map((tx) => (
              <div
                key={tx.transfer_id}
                className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">
                      {tx.sender_id} → {tx.receiver_id}
                    </span>
                    <span className="text-white font-bold truncate max-w-[150px]">{tx.filename}</span>
                  </div>
                  <span className="text-emerald-400 font-bold">{tx.status}</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${tx.progress_percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Speed: <strong className="text-cyan-300">{tx.speed_mb_s} MB/s</strong></span>
                  <span>Duration: {tx.duration_ms} ms</span>
                  <span className="text-slate-300">{(tx.filesize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center font-mono text-xs text-slate-500">
            No active mesh transfers running. Select any device card above or click &ldquo;Simultaneous Transfer Test&rdquo; to launch transfers.
          </div>
        )}
      </div>

      {/* ==================== SEND FILE MODAL ==================== */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel-glow border border-cyan-500/40 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <h3 className="font-cyber font-bold text-lg text-white">
                  INITIATE ENCRYPTED TRANSFER
                </h3>
              </div>
              <button
                onClick={() => setSendModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Sender and Receiver Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Origin Sender:</label>
                <select
                  value={senderDevice}
                  onChange={(e) => setSenderDevice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono outline-none"
                >
                  {networkState?.devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} ({d.name.split(' - ')[1]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Target Receiver:</label>
                <select
                  value={receiverDevice}
                  onChange={(e) => setReceiverDevice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/40 text-purple-300 text-xs font-mono outline-none"
                >
                  {networkState?.devices
                    .filter((d) => d.device_id !== senderDevice)
                    .map((d) => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.device_id} ({d.name.split(' - ')[1]})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* File Selection Box */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Select File (Optional):</label>
              <input
                type="file"
                onChange={(e) => e.target.files && setFileToTransfer(e.target.files[0])}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-cyan-950 file:text-cyan-300 file:text-xs"
              />
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                If no file is chosen, default encrypted intelligence payload will be transmitted.
              </p>
            </div>

            {/* Error Message */}
            {transferError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/60 text-xs font-mono text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{transferError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSendModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                disabled={transferring}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-xs font-mono font-bold text-white shadow-glow-cyan flex items-center gap-2 cursor-pointer"
              >
                {transferring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Transmitting...
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" /> Encrypt & Stream to {receiverDevice}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DEVICE PAIRING MODAL ==================== */}
      {pairModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel-glow border border-purple-500/40 space-y-5">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-purple-400" />
                <h3 className="font-cyber font-bold text-lg text-white">
                  DEVICE PAIRING AUTHENTICATION
                </h3>
              </div>
              <button
                onClick={() => setPairModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              To establish an authenticated ECDH channel between two devices, enter the target device&rsquo;s secret pairing code.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Initiating Device:</label>
                <select
                  value={pairInitiator}
                  onChange={(e) => setPairInitiator(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 outline-none"
                >
                  {networkState?.devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>
                      {d.device_id} ({d.name.split(' - ')[1]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Target Device:</label>
                <select
                  value={pairTarget}
                  onChange={(e) => setPairTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-purple-300 outline-none"
                >
                  {networkState?.devices
                    .filter((d) => d.device_id !== pairInitiator)
                    .map((d) => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.device_id} ({d.name.split(' - ')[1]})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-slate-400">Target Pairing Code:</label>
                <span className="text-[10px] font-mono text-slate-500">
                  Hint: Code for {pairTarget} is{' '}
                  <strong className="text-purple-300">
                    {networkState?.devices.find((d) => d.device_id === pairTarget)?.pairing_code}
                  </strong>
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. PAIR-DELTA-855"
                value={pairCodeInput}
                onChange={(e) => setPairCodeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-purple-500/40 text-xs font-mono text-white placeholder-slate-600 outline-none"
              />
            </div>

            {pairError && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/60 text-xs font-mono text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{pairError}</span>
              </div>
            )}

            {pairSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/60 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{pairSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPairModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePairing}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-xs font-mono font-bold text-white shadow-glow-purple flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Authorize Pairing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

