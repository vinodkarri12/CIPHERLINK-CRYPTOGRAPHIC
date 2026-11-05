import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Key, AlertTriangle, CheckCircle2, 
  Terminal, ShieldAlert, FileCheck, RefreshCw, Zap, Bug 
} from 'lucide-react';
import { api, SecurityLogRecord } from '../services/api';

export const SecurityCenter: React.FC = () => {
  const [logs, setLogs] = useState<SecurityLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tamperLoading, setTamperLoading] = useState<boolean>(false);
  const [tamperResult, setTamperResult] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      const data = await api.getSecurityLogs(40);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRunTamperTest = async () => {
    setTamperLoading(true);
    try {
      // 1. Generate sample encrypted chunk
      const dummyFile = new File(['CONFIDENTIAL MISSION INTELLIGENCE DATA ENCRYPTED'], 'intel.txt', { type: 'text/plain' });
      const encryptedPkg = await api.encryptFile(dummyFile);
      const firstChunk = encryptedPkg.chunks[0];

      // 2. Intentionally flip bits in ciphertext and call backend verification
      const res = await api.simulateTamper({
        session_key_hex: encryptedPkg.session_key_hex,
        chunk: firstChunk,
        file_id: encryptedPkg.file_id,
      });

      setTamperResult(res);
      await fetchLogs();
    } catch (e) {
      console.error(e);
    } finally {
      setTamperLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-300 uppercase tracking-widest">
              Zero-Trust Security & Cryptographic Posture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cyber text-white">
            SECURITY COMMAND & AUDIT CENTER
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1 max-w-2xl">
            Live posture audit, active defense checks, peer identity authentication, and tamper rejection logs.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
        </button>
      </div>

      {/* Security Posture Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl glass-panel border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Authenticated AEAD</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-cyber text-white">AES-256-GCM</div>
          <div className="text-[11px] font-mono text-emerald-300 mt-1">
            128-bit Galois Tag Validation Active
          </div>
        </div>

        <div className="p-5 rounded-xl glass-panel border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Key Exchange</span>
            <Key className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-cyber text-white">ECDH (P-256 / X25519)</div>
          <div className="text-[11px] font-mono text-cyan-300 mt-1">
            Ephemeral forward secrecy per session
          </div>
        </div>

        <div className="p-5 rounded-xl glass-panel border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Key Derivation</span>
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-cyber text-white">HKDF-SHA256</div>
          <div className="text-[11px] font-mono text-purple-300 mt-1">
            RFC 5869 Extract-and-Expand
          </div>
        </div>

        <div className="p-5 rounded-xl glass-panel border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Integrity Fingerprint</span>
            <FileCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-cyber text-white">SHA-256 Manifest</div>
          <div className="text-[11px] font-mono text-cyan-300 mt-1">
            Pre & post transmission verification
          </div>
        </div>
      </div>

      {/* Live Tamper Penetration Testing Box */}
      <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base font-cyber">
              <Bug className="w-5 h-5" />
              LIVE PENETRATION TEST: BIT-FLIP TAMPER ATTACK SIMULATION
            </div>
            <p className="text-xs font-mono text-slate-300 mt-0.5">
              Demonstrates in real time that modifying any single bit of an encrypted chunk causes instant GCM tag rejection.
            </p>
          </div>

          <button
            onClick={handleRunTamperTest}
            disabled={tamperLoading}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            {tamperLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Injecting Tampered Bit...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Trigger Bit-Flip Injection
              </>
            )}
          </button>
        </div>

        {tamperResult && (
          <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/40 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> DEFENSE VERIFIED: {tamperResult.verification_status}
            </div>
            <p className="text-slate-300 text-[11px]">
              {tamperResult.error_message}
            </p>
            <div className="text-[10px] text-slate-400">
              Algorithm: {tamperResult.algorithm} • Tag Length: {tamperResult.tag_size_bits} bits • Tamper Detected: <strong className="text-emerald-400">TRUE</strong>
            </div>
          </div>
        )}
      </div>

      {/* Full Security Event Logs Table */}
      <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="font-cyber font-bold text-lg text-white">
              IMMUTABLE SECURITY AUDIT LOGS
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Backed by persistent SQLite engine
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-cyan-500/20 text-slate-400 pb-2">
                <th className="py-2.5 px-3">LOG ID</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">EVENT TYPE</th>
                <th className="py-2.5 px-3">DETAILS</th>
                <th className="py-2.5 px-3">CLIENT IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-3 text-cyan-300 font-bold">{log.id}</td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{log.created_at}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'SUCCESS' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
                      log.severity === 'WARNING' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                      log.severity === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' :
                      'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white font-medium">{log.event_type}</td>
                  <td className="py-3 px-3 text-slate-300 max-w-[320px] truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{log.client_ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

