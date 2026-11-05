import React, { useState } from 'react';
import { 
  Shield, Send, Cpu, BarChart3, Lock, BookOpen, FileText, 
  Menu, X, Sparkles, Activity, RefreshCw, Network 
} from 'lucide-react';

export type PageId = 
  | 'command-center' 
  | 'four-device-network'
  | 'secure-transfer' 
  | 'ecc-engine' 
  | 'comparison-lab' 
  | 'security-center' 
  | 'project-info' 
  | 'documentation';

interface Props {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onReplayIntro: () => void;
  connectedPeers?: number;
}

export const Header: React.FC<Props> = ({
  currentPage,
  onSelectPage,
  onReplayIntro,
  connectedPeers = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'command-center', label: 'Command Center', icon: <Activity className="w-4 h-4" /> },
    { id: 'four-device-network', label: '4-Device Mesh', icon: <Network className="w-4 h-4" /> },
    { id: 'secure-transfer', label: 'Secure Transfer', icon: <Send className="w-4 h-4" /> },
    { id: 'ecc-engine', label: 'ECC Engine', icon: <Cpu className="w-4 h-4" /> },
    { id: 'comparison-lab', label: 'Algorithm Lab', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'security-center', label: 'Security Center', icon: <Lock className="w-4 h-4" /> },
    { id: 'project-info', label: 'Project Info', icon: <FileText className="w-4 h-4" /> },
    { id: 'documentation', label: 'Docs & FAQ', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: PageId) => {
    onSelectPage(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Identity */}
        <div 
          onClick={() => onSelectPage('command-center')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-900/60 to-purple-900/60 border border-cyan-400/40 flex items-center justify-center shadow-glow-cyan transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-cyber-cyan" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cyber font-bold text-xl tracking-wider bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
                CIPHERLINK
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                ECC v1.0
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              Your Files. Your Privacy. Your Control.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/40 shadow-glow-cyan'
                    : 'text-slate-300 hover:text-cyan-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Status */}
        <div className="flex items-center gap-3">
          {/* Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-emerald-500/30 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300">SIGNALING LIVE</span>
          </div>

          {/* Replay Intro Button */}
          <button
            onClick={onReplayIntro}
            title="Replay Cinematic Opening Sequence"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-300 bg-slate-900/60 hover:bg-cyan-950/40 border border-slate-700/50 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Intro</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-300 bg-slate-900/60 border border-slate-700/50 cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 pt-3 border-t border-cyan-500/20 flex flex-col gap-1 pb-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all text-left cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

