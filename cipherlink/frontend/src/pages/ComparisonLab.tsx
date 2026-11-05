import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Play, RefreshCw, Cpu, Zap, Shield, 
  CheckCircle2, Info, ArrowRight, Gauge, Layers 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, Legend 
} from 'recharts';
import { api, BenchmarkReport, BenchmarkResultItem } from '../services/api';

export const ComparisonLab: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('ALL');
  const [fileSizeMb, setFileSizeMb] = useState<number>(10);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const runBenchmarkSuite = async (algo = selectedAlgo, size = fileSizeMb) => {
    setIsRunning(true);
    setProgressMessage('Initializing CPU benchmark harnesses...');

    try {
      setTimeout(() => setProgressMessage('Measuring Asymmetric Keygen (ECC P-256 vs RSA-2048/3072)...'), 300);
      setTimeout(() => setProgressMessage('Testing ECDH Shared Secret Agreement & RSA-OAEP Key Wrapping...'), 900);
      setTimeout(() => setProgressMessage(`Executing AES-128 & AES-256-GCM symmetric throughput on ${size} MB...`), 1600);

      const res = await api.runBenchmarks(algo, size, 2);
      setReport(res);
      setProgressMessage('Benchmark suite completed successfully.');
    } catch (e) {
      console.error(e);
      setProgressMessage('Benchmark execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runBenchmarkSuite('ALL', 10);
  }, []);

  // Format data for Key Generation Chart
  const keygenData = report?.results
    .filter((r) => r.operation.includes('Key Pair Generation'))
    .map((r) => ({
      name: r.algorithm.split(' ')[0] + ' ' + (r.algorithm.includes('3072') ? '3072' : r.algorithm.includes('2048') ? '2048' : r.algorithm.includes('X25519') ? 'X25519' : 'P-256'),
      duration_ms: r.duration_ms,
      security: r.equivalent_security_level_bits,
      color: r.algorithm.includes('ECC') ? '#00E5FF' : '#8B5CF6',
    })) || [];

  // Format data for Key Agreement / Transport Chart
  const agreementData = report?.results
    .filter((r) => r.operation.includes('Agreement') || r.operation.includes('Transport'))
    .map((r) => ({
      name: r.operation.includes('ECDH') ? r.algorithm : 'RSA-OAEP Wrap/Unwrap',
      duration_ms: r.duration_ms,
      color: r.operation.includes('ECDH') ? '#00E5FF' : '#F59E0B',
    })) || [];

  // Format data for Symmetric Bulk Throughput Chart
  const throughputData = report?.results
    .filter((r) => r.throughput_mb_s)
    .map((r) => ({
      name: r.algorithm,
      throughput: r.throughput_mb_s,
      color: r.algorithm.includes('256') ? '#10B981' : '#00E5FF',
    })) || [];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gauge className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
              Live Hardware Cryptographic Benchmarking
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cyber text-white">
            ALGORITHM COMPARISON LABORATORY
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1 max-w-2xl">
            Live CPU hardware benchmarks comparing <strong>ECC</strong>, <strong>RSA</strong>, and <strong>AES</strong>. 
            Measures genuine execution time, key size parity, and symmetric throughput recorded directly from the host system.
          </p>
        </div>

        {/* CPU & Environment Tag */}
        {report && (
          <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs font-mono text-slate-300">
            <div className="text-[10px] text-slate-400">HOST PROCESSOR</div>
            <div className="text-cyan-300 font-bold truncate max-w-[220px]">{report.system_cpu}</div>
          </div>
        )}
      </div>

      {/* Control Panel: Algorithm & File Size Selection */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Algorithm Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Target Algorithm:</span>
            <div className="flex rounded-lg bg-black/60 p-1 border border-slate-700/60">
              {['ALL', 'ECC', 'RSA', 'AES'].map((algo) => (
                <button
                  key={algo}
                  onClick={() => setSelectedAlgo(algo)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    selectedAlgo === algo ? 'bg-cyan-500 text-black shadow-glow-cyan' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          {/* Test Payload Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Payload File Size:</span>
            <div className="flex rounded-lg bg-black/60 p-1 border border-slate-700/60">
              {[1, 10, 50, 100, 500].map((size) => (
                <button
                  key={size}
                  onClick={() => setFileSizeMb(size)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    fileSizeMb === size ? 'bg-purple-500 text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {size} MB
                </button>
              ))}
            </div>
          </div>

          {/* Start Benchmark Button */}
          <button
            onClick={() => runBenchmarkSuite(selectedAlgo, fileSizeMb)}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-xs font-mono font-bold text-white shadow-glow-cyan transition-all flex items-center gap-2 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Running Benchmarks...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Live Benchmark
              </>
            )}
          </button>
        </div>

        {/* Progress Message */}
        {isRunning && (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 animate-pulse bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/30">
            <Cpu className="w-4 h-4" />
            <span>{progressMessage}</span>
          </div>
        )}
      </div>

      {/* Benchmark Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Key Generation Time Comparison */}
        <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-cyber font-bold text-base text-white">
                KEY GENERATION TIME (MILLISECONDS)
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Lower is better • ECC P-256 vs RSA-2048 & RSA-3072
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              ASYMMETRIC
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keygenData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#475569" fontSize={11} fontFamily="JetBrains Mono" unit=" ms" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} fontFamily="JetBrains Mono" width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f24',
                    borderColor: '#00E5FF',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ms`, 'Time']}
                />
                <Bar dataKey="duration_ms" radius={[0, 4, 4, 0]}>
                  {keygenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] font-mono text-slate-400 bg-black/40 p-2.5 rounded-lg border border-slate-800">
            💡 <strong>Observation:</strong> ECC P-256 generates keys in ~0.5–2 ms, whereas equivalent RSA-3072 takes ~50–250 ms (~100x slower) due to finding large probabilistic primes.
          </div>
        </div>

        {/* Chart 2: Bulk Symmetric Encryption Throughput (MB/s) */}
        <div className="p-6 rounded-2xl glass-panel border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-cyber font-bold text-base text-white">
                BULK SYMMETRIC THROUGHPUT (MB/s)
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Higher is better • Hardware AES-NI authenticated streaming
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              SYMMETRIC
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#475569" fontSize={11} fontFamily="JetBrains Mono" unit=" MB/s" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f24',
                    borderColor: '#10B981',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} MB/s`, 'Throughput']}
                />
                <Bar dataKey="throughput" radius={[4, 4, 0, 0]}>
                  {throughputData.map((entry, index) => (
                    <Cell key={`cell-tp-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] font-mono text-slate-400 bg-black/40 p-2.5 rounded-lg border border-slate-800">
            ⚡ <strong>Observation:</strong> CIPHERLINK uses AES-256-GCM for all bulk file chunks, achieving multiple gigabytes per second with zero ciphertext inflation beyond 16-byte authentication tags.
          </div>
        </div>
      </div>

      {/* Raw Benchmark Results Table */}
      <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cyber font-bold text-lg text-white">
            COMPREHENSIVE TELEMETRY DATA SHEET
          </h2>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Genuine Host Measurements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-cyan-500/20 text-slate-400 pb-2">
                <th className="py-2.5 px-3">OPERATION</th>
                <th className="py-2.5 px-3">ALGORITHM</th>
                <th className="py-2.5 px-3">CATEGORY</th>
                <th className="py-2.5 px-3">KEY SIZE</th>
                <th className="py-2.5 px-3">SECURITY LEVEL</th>
                <th className="py-2.5 px-3">DURATION</th>
                <th className="py-2.5 px-3">THROUGHPUT</th>
                <th className="py-2.5 px-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {report?.results.map((r, i) => (
                <tr key={i} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="py-3 px-3 font-medium text-white">{r.operation}</td>
                  <td className="py-3 px-3 text-cyan-300 font-bold">{r.algorithm}</td>
                  <td className="py-3 px-3 text-slate-400">{r.category}</td>
                  <td className="py-3 px-3 text-slate-300">{r.key_size_bits} bits</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-200 border border-slate-700">
                      {r.equivalent_security_level_bits}-bit
                    </span>
                  </td>
                  <td className="py-3 px-3 text-white font-bold">{r.duration_ms} ms</td>
                  <td className="py-3 px-3 text-emerald-400">
                    {r.throughput_mb_s ? `${r.throughput_mb_s} MB/s` : 'N/A (Key Op)'}
                  </td>
                  <td className="py-3 px-3 text-slate-400 truncate max-w-[200px]" title={r.notes}>
                    {r.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architectural Insights from Benchmark */}
      {report?.insights && (
        <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Info className="w-5 h-5" />
            <h3 className="font-cyber font-bold text-base text-white">Cryptographic Engineering Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
            {report.insights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 leading-relaxed">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

