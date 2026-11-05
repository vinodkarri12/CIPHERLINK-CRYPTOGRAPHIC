import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleNetwork } from './animations/ParticleNetwork';
import { CinematicIntro } from './animations/CinematicIntro';
import { Header, PageId } from './components/Header';
import { CommandCenter } from './pages/CommandCenter';
import { FourDeviceNetwork } from './pages/FourDeviceNetwork';
import { SecureTransfer } from './pages/SecureTransfer';
import { ECCEngine } from './pages/ECCEngine';
import { ComparisonLab } from './pages/ComparisonLab';
import { SecurityCenter } from './pages/SecurityCenter';
import { ProjectInfo } from './pages/ProjectInfo';
import { Documentation } from './pages/Documentation';
import { Shield, Lock, Terminal, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Check if intro has been seen in this session
    return sessionStorage.getItem('cipherlink_intro_seen') !== 'true';
  });

  const validPages: PageId[] = [
    'command-center',
    'four-device-network',
    'secure-transfer',
    'ecc-engine',
    'comparison-lab',
    'security-center',
    'project-info',
    'documentation',
  ];

  const getPageFromHash = (): PageId => {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    return validPages.includes(rawHash as PageId) ? (rawHash as PageId) : 'command-center';
  };

  const [currentPage, setCurrentPage] = useState<PageId>(() => getPageFromHash());

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePageSelect = (page: PageId) => {
    setCurrentPage(page);
    if (window.location.hash !== `#${page}`) {
      window.location.hash = page;
    }
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('cipherlink_intro_seen', 'true');
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  return (
    <div className="relative min-h-screen bg-[#050711] text-slate-100 font-sans overflow-x-hidden">
      {/* Cinematic Opening Intro Experience */}
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}

      {/* Background Interactive Particle Network Canvas */}
      <ParticleNetwork />

      {/* Main App Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <Header
          currentPage={currentPage}
          onSelectPage={handlePageSelect}
          onReplayIntro={handleReplayIntro}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {currentPage === 'command-center' && <CommandCenter onNavigate={handlePageSelect} />}
              {currentPage === 'four-device-network' && <FourDeviceNetwork />}
              {currentPage === 'secure-transfer' && <SecureTransfer />}
              {currentPage === 'ecc-engine' && <ECCEngine />}
              {currentPage === 'comparison-lab' && <ComparisonLab />}
              {currentPage === 'security-center' && <SecurityCenter />}
              {currentPage === 'project-info' && <ProjectInfo />}
              {currentPage === 'documentation' && <Documentation />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Cyber Footer */}
        <footer className="border-t border-cyan-500/20 glass-panel py-6 px-4 sm:px-8 mt-12 text-xs font-mono text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-cyber font-bold text-white tracking-wider">
                CIPHERLINK
              </span>
              <span className="text-slate-500">|</span>
              <span>Next-Gen ECC Hybrid File Transfer Platform</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>AES-256-GCM Hardware Accelerated</span>
              </span>
              <span>•</span>
              <span>ECDH SECP256R1 / Curve25519</span>
              <span>•</span>
              <span>HKDF-SHA256 (RFC 5869)</span>
            </div>

            <div className="text-[11px] text-slate-500">
              © 2026 CIPHERLINK Security Systems. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

