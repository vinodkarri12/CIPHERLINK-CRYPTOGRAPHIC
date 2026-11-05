import React, { useState, useEffect } from 'react';
import { 
  Cpu, Key, Shield, ArrowRight, RefreshCw, Lock, 
  Sparkles, CheckCircle2, ChevronRight, Layers, HelpCircle, Code 
} from 'lucide-react';
import { ThreeEllipticCurve } from '../animations/ThreeEllipticCurve';
import { api, DeriveSecretResponse } from '../services/api';

export const ECCEngine: React.FC = () => {
  const [curve, setCurve] = useState<'SECP256R1' | 'X25519'>('SECP256R1');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [derivationResult, setDerivationResult] = useState<DeriveSecretResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const steps = [
    {
      num: 1,
      title: 'Private Scalar Selection',
      subtitle: 'Alice & Bob generate private integers',
      math: 'd_A, d_B ∈ [1, n-1]',
      desc: 'Each party chooses a cryptographically secure random 256-bit number. This integer is kept strictly confidential and never transmitted.',
      computer: 'Local Node'
    },
    {
      num: 2,
      title: 'Public Key Point Multiplication',
      subtitle: 'Multiply scalar by Generator Point G',
      math: 'Q_A = d_A · G,  Q_B = d_B · G',
      desc: 'Using the double-and-add algorithm, point G on the elliptic curve is multiplied d times. The Elliptic Curve Discrete Logarithm Problem (ECDLP) makes it mathematically infeasible to reverse Q to find d.',
      computer: 'Point Multiplication'
    },
    {
      num: 3,
      title: 'Public Key Exchange',
      subtitle: 'Parties exchange curve coordinates (x, y)',
      math: 'Alice ⇄ Bob (Q_A, Q_B)',
      desc: 'Alice transmits her public point Q_A across the insecure network; Bob transmits Q_B. Even an eavesdropper recording both public keys cannot calculate the private scalars.',
      computer: 'Public Network'
    },
    {
      num: 4,
      title: 'ECDH Shared Secret Agreement',
      subtitle: 'Both compute the identical curve point',
      math: 'S = d_A · Q_B = d_A · (d_B · G) = d_B · (d_A · G) = d_B · Q_A',
      desc: 'Because point scalar multiplication is commutative and associative, both Alice and Bob compute the exact same 3D point S without sharing secrets.',
      computer: 'Diffie-Hellman Core'
    },
    {
      num: 5,
      title: 'HKDF-SHA256 Derivation',
      subtitle: 'Extract & expand high-entropy AES key',
      math: 'K_AES = HKDF-Expand(HKDF-Extract(salt, S_x), info, 32)',
      desc: 'Raw curve points can exhibit mathematical non-uniformity. HKDF (RFC 5869) extracts the entropy and derives a pristine, uniform 256-bit symmetric encryption key.',
      computer: 'Key Derivation Function'
    },
    {
      num: 6,
      title: 'AES-256-GCM Authenticated Stream',
      subtitle: 'Symmetric bulk payload transmission',
      math: 'Ciphertext, Tag = AES-GCM(K_AES, IV, Data, AAD)',
      desc: 'With the shared 256-bit key established, files are transmitted using hardware-accelerated AES-GCM with 128-bit authentication tags.',
      computer: 'Galois Counter Mode'
    }
  ];

  const handleRunDerivation = async () => {
    setLoading(true);
    try {
      const res = await api.deriveSharedSecret({ curve });
      setDerivationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunDerivation();
  }, [curve]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
              Interactive Cryptographic Visualizer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cyber text-white">
            ELLIPTIC CURVE CRYPTOGRAPHY ENGINE
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1 max-w-2xl">
            Step-by-step mathematical demonstration of ECDH key agreement, HKDF derivation, and AES-256-GCM hybrid encryption.
          </p>
        </div>

        {/* Curve Toggle */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-xl border border-cyan-500/30">
          <button
            onClick={() => setCurve('SECP256R1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              curve === 'SECP256R1' ? 'bg-cyan-500 text-black shadow-glow-cyan' : 'text-slate-300 hover:text-white'
            }`}
          >
            NIST P-256 (SECP256R1)
          </button>
          <button
            onClick={() => setCurve('X25519')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              curve === 'X25519' ? 'bg-purple-500 text-white shadow-glow-purple' : 'text-slate-300 hover:text-white'
            }`}
          >
            Curve25519 (X25519)
          </button>
        </div>
      </div>

      {/* 3D Curve Visualizer Component */}
      <ThreeEllipticCurve curveType={curve} />

      {/* Animated Step-by-Step Flow Pipeline */}
      <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="font-cyber font-bold text-lg text-white">
              END-TO-END CRYPTOGRAPHIC PIPELINE
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Click any step to inspect mathematical breakdown
          </span>
        </div>

        {/* Step Selector Horizontal Pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {steps.map((s) => {
            const isSelected = activeStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setActiveStep(s.num)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-glow-cyan text-white'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-cyan-500/30 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isSelected ? 'bg-cyan-400 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {s.num}
                  </span>
                  <span className="text-[9px] font-mono opacity-60 uppercase">{s.computer}</span>
                </div>
                <div className="font-cyber font-bold text-xs truncate">
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Active Step Inspector Card */}
        {(() => {
          const cur = steps.find((s) => s.num === activeStep) || steps[0];
          return (
            <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                    <span>STEP {cur.num} OF 6</span>
                    <span>•</span>
                    <span className="text-slate-400">{cur.subtitle}</span>
                  </div>
                  <h3 className="font-cyber font-bold text-xl text-white mt-0.5">
                    {cur.title}
                  </h3>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/40 font-mono text-cyan-300 text-xs font-bold">
                  {cur.math}
                </div>
              </div>

              <p className="text-sm font-mono text-slate-300 leading-relaxed">
                {cur.desc}
              </p>

              {/* Step 4 Live Result Box */}
              {cur.num === 4 && derivationResult && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono space-y-2">
                  <div className="text-cyan-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    LIVE ECDH DERIVATION RESULT ({derivationResult.curve})
                  </div>
                  <div className="text-slate-400 truncate">
                    Shared Secret Hash: <span className="text-cyan-200">{derivationResult.shared_secret_hash}</span>
                  </div>
                  <div className="text-slate-400">
                    Mathematical Proof: <span className="text-emerald-300">{derivationResult.mathematical_proof}</span>
                  </div>
                </div>
              )}

              {/* Step 5 HKDF Key Box */}
              {cur.num === 5 && derivationResult && (
                <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-mono space-y-2">
                  <div className="text-purple-300 font-bold flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-400" />
                    HKDF-SHA256 DERIVED SYMMETRIC MASTER KEY
                  </div>
                  <div className="text-slate-400">
                    Key Preview (Masked): <strong className="text-emerald-400 text-sm">{derivationResult.aes_key_preview}</strong>
                  </div>
                  <div className="text-slate-400">
                    Salt Used: <span className="text-purple-200">{derivationResult.hkdf_salt_used}</span>
                  </div>
                  <div className="text-slate-400">
                    Context Info: <span className="text-slate-300 font-mono">{derivationResult.derivation_info}</span>
                  </div>
                </div>
              )}

              {/* Navigation stepper buttons */}
              <div className="flex justify-between pt-2">
                <button
                  disabled={activeStep <= 1}
                  onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-mono text-slate-300 cursor-pointer"
                >
                  ← Previous Step
                </button>
                <button
                  disabled={activeStep >= 6}
                  onClick={() => setActiveStep((prev) => Math.min(6, prev + 1))}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 disabled:opacity-40 text-xs font-mono text-cyan-300 cursor-pointer flex items-center gap-1"
                >
                  Next Step →
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Comparative Educational Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <HelpCircle className="w-5 h-5" />
            <h3 className="font-cyber font-bold text-base text-white">Why 256-bit ECC Equals 3072-bit RSA</h3>
          </div>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            The best known attack against RSA (General Number Field Sieve) runs in sub-exponential time. 
            In contrast, the fastest algorithm for solving the Discrete Logarithm Problem on elliptic curves (Pollard's rho) runs in full exponential time <span className="text-cyan-300">O(√n)</span>. 
            Consequently, a 256-bit ECC key achieves the same 128-bit security level as an enormous 3072-bit RSA key with ~91% less key transmission overhead.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2 text-purple-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-cyber font-bold text-base text-white">Why ECC Is Never Used for Bulk File Encryption</h3>
          </div>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Asymmetric mathematical operations like point scalar multiplication involve multiple multi-precision modular squarings and inversions. 
            Encrypting a 500 MB file directly with ECC would consume minutes of CPU power and result in severe ciphertext expansion. 
            Instead, modern security systems (including CIPHERLINK) use <strong>Hybrid Cryptography</strong>: ECC creates the keys in milliseconds, and hardware-accelerated AES-GCM encrypts files at multiple gigabytes per second.
          </p>
        </div>
      </div>
    </div>
  );
};

