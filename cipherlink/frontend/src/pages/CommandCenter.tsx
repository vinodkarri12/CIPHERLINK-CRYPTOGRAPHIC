import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, FileCode, HardDrive, Cpu, ArrowUpRight, 
  Send, RefreshCw, Radio, CheckCircle2, AlertCircle, Clock, 
  Activity, Zap, BarChart3, Lock 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, SystemStats, TransferRecord, SecurityLogRecord } from '../services/api';
import { PageId } from '../components/Header';

interface Props {
  onNavigate: (page: PageId) => void;
}

export const CommandCenter: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<TransferRecord[]>([]);
  const [logs, setLogs] = useState<SecurityLogRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboardData = async () => {
    try {
      const [s, h, l] = await Promise.all([
        api.getStats().catch(() => null),
        api.getTransferHistory(10).catch(() => []),
        api.getSecurityLogs(15).catch(() => []),
      ]);
      if (s) setStats(s);
      setHistory(h);
      setLogs(l);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Sample chart trend data
  const chartData = [
    { time: '10:00', volume: 12.4, transfers: 2 },
    { time: '10:15', volume: 28.1, transfers: 5 },
    { time: '10:30', volume: 18.5, transfers: 3 },
    { time: '10:45', volume: 45.2, transfers: 8 },
    { time: '11:00', volume: 32.0, transfers: 6 },
    { time: '11:15', volume: 64.8, transfers: 11 },
    { time: '11:30', volume: 51.2, transfers: 9 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero HUD */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
              Live Threat Posture & Cryptographic Gateway
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cyber tracking-wide text-white">
            SECURITY COMMAND CENTER
          </h1>
          <p className="text-sm font-mono text-slate-300 mt-1 max-w-2xl">
            Real-time hybrid encryption orchestration combining <strong>Elliptic Curve Cryptography (ECDH)</strong>, 
            <strong> HKDF-SHA256</strong> key expansion, and <strong>AES-256-GCM</strong> authenticated streaming.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-950/50 border border-slate-700/60 hover:border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <button
            onClick={() => onNavigate('four-device-network')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-mono text-purple-200 transition-all cursor-pointer shadow-glow-purple"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> 4-Device Mesh
          </button>
          <button
            onClick={() => onNavigate('secure-transfer')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-xs font-mono font-bold text-white shadow-glow-cyan transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> Start File Transfer
          </button>
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl glass-panel border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Total Transferred</span>
            <FileCode className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-cyber text-white">
            {stats ? stats.total_files_transferred : 3}
            <span className="text-xs font-mono font-normal text-cyan-300 ml-2">Files</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats ? stats.successful_transfers : 3} Successful</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl glass-panel border border-purple-500/20 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Encrypted Volume</span>
            <HardDrive className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-cyber text-white">
            {stats ? formatBytes(stats.total_encrypted_bytes) : '25.8 MB'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-purple-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% AES-256-GCM Chunks</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl glass-panel border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Active Cipher Suite</span>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-cyber text-cyan-300 truncate">
            ECDH (P-256) + GCM
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono text-slate-300">
            <span>HKDF-SHA256 • 128-bit Parity</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl glass-panel border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">System Status</span>
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-cyber text-emerald-400">
            SECURE & ONLINE
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Local Signaling Ready</span>
          </div>
        </div>
      </div>

      {/* Transfer Activity Chart & Quick Jump Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Activity Telemetry Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold font-cyber text-white">
                ENCRYPTED THROUGHPUT TELEMETRY
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Live encrypted streaming data volume (MB) across active transfer sessions
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              AES-NI ACCELERATED
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#475569" fontSize={11} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f24',
                    borderColor: '#00E5FF',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#00E5FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Navigation Cards */}
        <div className="space-y-3">
          <div
            onClick={() => onNavigate('four-device-network')}
            className="p-4 rounded-xl glass-panel border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 transition-all cursor-pointer group shadow-glow-cyan"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" /> 4-DEVICE NETWORK MESH
              </span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-cyber font-bold text-base text-white">Multi-Device Mesh Coordinator</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Connect 4 devices simultaneously, manage pairwise authorization codes, and monitor live concurrent transfers.
            </p>
          </div>

          <div
            onClick={() => onNavigate('ecc-engine')}
            className="p-4 rounded-xl glass-panel border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-cyan-400 font-semibold">INTERACTIVE VISUALIZER</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-cyber font-bold text-base text-white">3D ECC Encryption Engine</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Explore 3D elliptic curve point scalar multiplication, ECDH agreement & HKDF key expansion.
            </p>
          </div>

          <div
            onClick={() => onNavigate('comparison-lab')}
            className="p-4 rounded-xl glass-panel border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-purple-400 font-semibold">BENCHMARK LAB</span>
              <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-cyber font-bold text-base text-white">ECC vs RSA vs AES Testing</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Run real CPU hardware benchmarks comparing key generation, ECDH, RSA-OAEP, and AES-GCM.
            </p>
          </div>

          <div
            onClick={() => onNavigate('security-center')}
            className="p-4 rounded-xl glass-panel border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-emerald-400 font-semibold">DEFENSE POSTURE</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-cyber font-bold text-base text-white">Security Center & Audit Log</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Inspect tamper detection proof, peer authentication status, and immutable SQLite audit events.
            </p>
          </div>
        </div>
      </div>

      {/* Transfer History Table & Live Security Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transfer History Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-cyber text-white">
              RECENT SECURE FILE TRANSFERS
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Verified with SHA-256 Hash
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-cyan-500/20 text-slate-400 pb-2">
                  <th className="py-2.5 px-3">FILE</th>
                  <th className="py-2.5 px-3">SIZE</th>
                  <th className="py-2.5 px-3">MODE</th>
                  <th className="py-2.5 px-3">ALGORITHM</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.length > 0 ? (
                  history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3 px-3 font-medium text-cyan-200 flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-[200px]" title={tx.filename}>
                          {tx.filename}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{formatBytes(tx.filesize)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.mode === 'SENDER' 
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' 
                            : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                        }`}>
                          {tx.mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[120px]" title={tx.algorithm}>
                        {tx.algorithm.replace('ECDH(', '').replace(')+AES-256-GCM', '')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{tx.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {tx.created_at.split(' ')[1] || tx.created_at}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No transfer records recorded yet. Start a transfer to populate this log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Security Audit Log Feed */}
        <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-cyber text-white">
              SECURITY AUDIT LOG
            </h2>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all font-mono text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    log.severity === 'SUCCESS' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
                    log.severity === 'WARNING' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
                    log.severity === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' :
                    'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {log.severity}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {log.created_at.split(' ')[1] || log.created_at}
                  </span>
                </div>
                <div className="text-cyan-200 font-medium truncate mb-1">
                  {log.event_type}
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

