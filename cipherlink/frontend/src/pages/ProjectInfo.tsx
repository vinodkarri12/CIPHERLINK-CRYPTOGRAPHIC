import React, { useState } from 'react';
import { 
  FileText, Shield, Cpu, Layers, CheckCircle2, AlertOctagon, 
  Sparkles, Code, Globe, ArrowRight, Zap, Award 
} from 'lucide-react';

export const ProjectInfo: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');

  const sections = [
    { id: 'intro', num: '01', title: 'Project Introduction' },
    { id: 'problem', num: '02', title: 'Problem Statement' },
    { id: 'existing', num: '03', title: 'Existing System' },
    { id: 'proposed', num: '04', title: 'Proposed System' },
    { id: 'objectives', num: '05', title: 'Project Objectives' },
    { id: 'architecture', num: '06', title: 'System Architecture' },
    { id: 'methodology', num: '07', title: 'Working Methodology' },
    { id: 'technologies', num: '08', title: 'Technologies Used' },
    { id: 'advantages', num: '09', title: 'Advantages' },
    { id: 'applications', num: '10', title: 'Applications' },
    { id: 'limitations', num: '11', title: 'Limitations' },
    { id: 'future', num: '12', title: 'Future Scope' },
    { id: 'conclusion', num: '13', title: 'Conclusion' },
  ];

  return (
    <div className="space-y-6">
      {/* Presentation Header HUD */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-glow border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
              Academic & Technical Viva Showcase
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-cyber text-white">
            PROJECT INFORMATION & SYSTEM SPECIFICATIONS
          </h1>
          <p className="text-xs sm:text-sm font-mono text-slate-300 mt-1 max-w-2xl">
            Complete formal documentation covering the 13 foundational engineering domains of CIPHERLINK.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-xs font-mono text-cyan-300">
          <Award className="w-4 h-4 text-cyan-400" /> VIVA-READY PRESENTATION
        </div>
      </div>

      {/* Quick Navigation Pills */}
      <div className="flex flex-wrap gap-2 p-3 rounded-xl glass-panel border border-cyan-500/20">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveSection(s.id);
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              activeSection === s.id
                ? 'bg-cyan-500 text-black font-bold shadow-glow-cyan'
                : 'bg-slate-900/60 text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <span className="opacity-60 mr-1.5">{s.num}</span> {s.title}
          </button>
        ))}
      </div>

      {/* 13 Structured Academic Project Sections */}
      <div className="space-y-6">

        {/* 1. Project Introduction */}
        <section id="intro" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>01</span> • Introduction
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Project Introduction</h2>
          <p className="text-sm font-mono text-slate-300 leading-relaxed">
            In modern networked environments, confidential digital assets are routinely transferred across unencrypted or semi-trusted communication channels. 
            Traditional asymmetric cryptosystems like RSA require exorbitant computational power and large keys (3072+ bits) to maintain modern 128-bit security margins.
            <strong> CIPHERLINK</strong> is a next-generation secure file transfer platform architected on <strong>Elliptic Curve Cryptography (ECC)</strong>. 
            By marrying the algebraic richness of Weierstrass/Montgomery curves with hardware-accelerated <strong>AES-256-GCM</strong> authenticated encryption, 
            CIPHERLINK delivers military-grade confidentiality, forward secrecy, and tamper detection with minimal bandwidth and CPU overhead.
          </p>
        </section>

        {/* 2. Problem Statement */}
        <section id="problem" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>02</span> • Problem Statement
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Problem Statement</h2>
          <p className="text-sm font-mono text-slate-300 leading-relaxed">
            Legacy file transfer protocols (e.g., FTP, unauthenticated HTTP, and outdated RSA-1024/2048 implementations) suffer from severe vulnerabilities:
          </p>
          <ul className="list-disc list-inside text-xs font-mono text-slate-300 space-y-1.5 pl-2">
            <li>Susceptibility to Man-in-the-Middle (MitM) eavesdropping and packet injection.</li>
            <li>Inability to provide authenticated encryption (lack of Galois/GCM message authentication codes).</li>
            <li>Extreme CPU consumption and power drain on mobile/IoT devices during RSA prime generation and modular exponentiation.</li>
            <li>Lack of Perfect Forward Secrecy (PFS), leaving historical archives vulnerable if a master key is compromised.</li>
          </ul>
        </section>

        {/* 3. Existing System */}
        <section id="existing" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>03</span> • Existing System
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Existing System & Limitations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="font-bold text-amber-300 mb-1">RSA Key Transport Systems</h3>
              <p>Relies on factoring $N = p \cdot q$. Requires 3072–4096 bit modulus. High network payload sizes; slow key generation times (&gt;100 ms on constrained hardware).</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="font-bold text-amber-300 mb-1">Standard CBC-Mode File Encryption</h3>
              <p>Lacks built-in authentication tag. Susceptible to padding oracle attacks (e.g., POODLE, Lucky Thirteen) and bit-flipping manipulation in transit.</p>
            </div>
          </div>
        </section>

        {/* 4. Proposed System */}
        <section id="proposed" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>04</span> • Proposed System
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Proposed CIPHERLINK Architecture</h2>
          <p className="text-sm font-mono text-slate-300 leading-relaxed">
            CIPHERLINK introduces a state-of-the-art <strong>Hybrid Cryptosystem</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200">
              <strong className="block text-white mb-1">1. ECDH Key Agreement</strong>
              Ephemeral NIST P-256 or X25519 keypairs agree on shared point $S = d_A \cdot Q_B$ without disclosing secrets.
            </div>
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200">
              <strong className="block text-white mb-1">2. HKDF Key Expansion</strong>
              RFC 5869 extract-and-expand pipeline extracts uniform 256-bit symmetric entropy with dynamic salts.
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200">
              <strong className="block text-white mb-1">3. AES-256-GCM Streaming</strong>
              Chunked authenticated streaming with unique nonces, bound AAD metadata, and 128-bit authentication tags.
            </div>
          </div>
        </section>

        {/* 5. Project Objectives */}
        <section id="objectives" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>05</span> • Objectives
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Project Objectives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Implement genuine mathematical ECDH key exchange on SECP256R1 and Curve25519.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Achieve high-throughput chunked authenticated encryption via AES-256-GCM.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Ensure complete tamper rejection before decryption execution.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Provide live, non-simulated benchmark comparisons across ECC, RSA, and AES.</span>
            </div>
          </div>
        </section>

        {/* 6. System Architecture */}
        <section id="architecture" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>06</span> • Architecture
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">System Architecture & Data Flow</h2>
          
          {/* Architectural Diagram Box */}
          <div className="p-5 rounded-xl bg-black/60 border border-cyan-500/30 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-2 text-center">
              <span className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold">
                Sender Browser (React UI)
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 font-bold">
                ECDH Public Exchange (SECP256R1)
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300 font-bold">
                HKDF Key Derivation (256-bit AES)
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold">
                AES-256-GCM Streaming
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold">
                Receiver Browser (Download Verified)
              </span>
            </div>
          </div>
        </section>

        {/* 7. Working Methodology */}
        <section id="methodology" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>07</span> • Working Methodology
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Working Methodology</h2>
          <ol className="list-decimal list-inside text-xs font-mono text-slate-300 space-y-2 pl-2">
            <li><strong>Room Signaling:</strong> Sender and Receiver join a shared communication room via WebSockets.</li>
            <li><strong>ECDH Handshake:</strong> Both peers generate ephemeral private scalar keys and publish public points.</li>
            <li><strong>Shared Secret Derivation:</strong> Both calculate scalar multiplication S = d · Q_peer.</li>
            <li><strong>HKDF Expansion:</strong> Master secret expanded into a 32-byte AES key using HKDF-SHA256 with salt.</li>
            <li><strong>Chunk Encryption:</strong> File split into 64 KB chunks, each encrypted under AES-GCM with distinct IVs.</li>
            <li><strong>Integrity Verification:</strong> Receiver authenticates all 128-bit GMAC tags and validates full SHA-256 digest.</li>
          </ol>
        </section>

        {/* 8. Technologies Used */}
        <section id="technologies" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>08</span> • Technologies Used
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Technical Stack & Libraries</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">React + Vite + TS</span>
              Modern frontend SPA
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">Python FastAPI</span>
              Async REST & WebSocket Gateway
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">Python Cryptography</span>
              OpenSSL 3.x bindings
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">Three.js</span>
              3D Elliptic curve geometry
            </div>
          </div>
        </section>

        {/* 9. Advantages */}
        <section id="advantages" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>09</span> • Advantages
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">System Advantages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-cyan-300 block mb-1">91.7% Smaller Keys</strong>
              256-bit ECC matches 3072-bit RSA security with ~92% reduction in key size overhead.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-purple-300 block mb-1">Hardware Accelerated</strong>
              AES-GCM utilizes Intel AES-NI instruction sets for line-rate encryption.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <strong className="text-emerald-300 block mb-1">Perfect Forward Secrecy</strong>
              Compromise of long-term identity does not compromise past transfer sessions.
            </div>
          </div>
        </section>

        {/* 10. Applications */}
        <section id="applications" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>10</span> • Real-World Applications
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Commercial & Industrial Applications</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300">
            <li className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <strong>Defense & Intelligence:</strong> Secure transmission of mission telemetry and classified imagery.
            </li>
            <li className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <strong>Healthcare (HIPAA):</strong> Confidential sharing of patient diagnostic MRI and genome records.
            </li>
            <li className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <strong>Financial Institutions:</strong> Secure settlement reports and SWIFT message payloads.
            </li>
            <li className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <strong>IoT & Mobile:</strong> Ultra-low power crypto for microcontrollers and edge drones.
            </li>
          </ul>
        </section>

        {/* 11. Limitations */}
        <section id="limitations" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>11</span> • Limitations
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Known Technical Limitations</h2>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            While classical attacks against 256-bit ECC require $2^{128}$ operations, theoretical large-scale fault-tolerant quantum computers running Shor's algorithm could solve the Discrete Logarithm Problem in polynomial time. (Mitigation: Integration of Post-Quantum ML-KEM/Kyber).
          </p>
        </section>

        {/* 12. Future Scope */}
        <section id="future" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>12</span> • Future Scope
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Future Research & Extensions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-purple-300 font-bold block mb-1">Post-Quantum Hybrids</span>
              Combine X25519 with NIST FIPS 203 (ML-KEM-768).
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-purple-300 font-bold block mb-1">WebRTC DataChannels</span>
              Direct P2P UDP streaming bypassing intermediary servers.
            </div>
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-purple-300 font-bold block mb-1">Zero-Knowledge Proofs</span>
              zk-SNARKs for identity verification without disclosing public keys.
            </div>
          </div>
        </section>

        {/* 13. Conclusion */}
        <section id="conclusion" className="p-6 rounded-2xl glass-panel border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider font-bold">
            <span>13</span> • Conclusion
          </div>
          <h2 className="text-xl font-bold font-cyber text-white">Conclusion</h2>
          <p className="text-sm font-mono text-slate-300 leading-relaxed">
            CIPHERLINK successfully proves that combining Elliptic Curve Cryptography (ECDH) with HKDF key derivation and AES-256-GCM establishes a resilient, high-speed, and cryptographically sound file transfer architecture. 
            The system achieves 128-bit security parity with RSA-3072 while dramatically reducing key exchange latency, memory footprint, and bandwidth consumption, making it the ideal paradigm for next-generation secure communications.
          </p>
        </section>

      </div>
    </div>
  );
};
