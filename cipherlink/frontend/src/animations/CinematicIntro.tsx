import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Lock, ArrowRight, Zap, FastForward } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<Props> = ({ onComplete }) => {
  // Sequence phase: 1 to 8, then 9 on exit
  const [phase, setPhase] = useState<number>(1);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    // Stage-by-stage progression
    const timers = [
      setTimeout(() => setPhase(2), 500),   // Particles appear
      setTimeout(() => setPhase(3), 1300),  // Circuits form
      setTimeout(() => setPhase(4), 2200),  // Elliptic curve glows
      setTimeout(() => setPhase(5), 3200),  // Two keys exchange energy beam
      setTimeout(() => setPhase(6), 4400),  // CIPHERLINK logo materializes
      setTimeout(() => setPhase(7), 5300),  // Tagline appears
      setTimeout(() => setPhase(8), 6000),  // ENTER SYSTEM button activates
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleEnter = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.08 : 1 }}
      transition={{ duration: 0.75, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-[#050711] flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-md transition-all shadow-glow-cyan"
      >
        <FastForward className="w-3.5 h-3.5" /> Skip Intro
      </button>

      {/* PHASE 2: Neon Digital Particle Network */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Grid of circuit node particles */}
            <div className="absolute inset-0 circuit-grid opacity-30" />
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: `${(i * 17) % 100}vw`,
                  y: `${(i * 23) % 100}vh`,
                  scale: 0.6,
                  opacity: 0.2,
                }}
                animate={{
                  y: [`${(i * 23) % 100}vh`, `${((i * 23 + 40) % 100)}vh`],
                  opacity: [0.2, 0.7, 0.2],
                }}
                transition={{
                  duration: 6 + (i % 5),
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  i % 2 === 0 ? 'bg-[#00E5FF] shadow-glow-cyan' : 'bg-[#8B5CF6] shadow-glow-purple'
                }`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 3 & 4: Elliptic Curve Ring & Circuit Traces in Center */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
        {/* Animated Background Rings */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
              animate={{ scale: 1, opacity: 0.5, rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border border-dashed border-cyan-500/30 rounded-full"
            />
          )}
        </AnimatePresence>

        {/* PHASE 4: Glowing Elliptic Curve SVG */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.svg
              viewBox="-60 -60 120 120"
              initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
              animate={{ pathLength: 1, opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute inset-4 w-full h-full pointer-events-none drop-shadow-[0_0_20px_rgba(0,229,255,0.7)]"
            >
              {/* Elliptic Curve Upper and Lower Arc: y^2 = x^3 - x + 1 */}
              <motion.path
                d="M -35,0 C -30,25 -5,35 45,55"
                fill="none"
                stroke="#00E5FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4 }}
              />
              <motion.path
                d="M -35,0 C -30,-25 -5,-35 45,-55"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4 }}
              />
              <motion.circle cx="-35" cy="0" r="3.5" fill="#00E5FF" />
              <motion.circle cx="30" cy="45" r="3.5" fill="#8B5CF6" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* PHASE 5: Digital Key Exchange with Energy Beam */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between px-6 pointer-events-none"
            >
              {/* Key A - Alice (Cyan) */}
              <motion.div
                initial={{ x: -40, scale: 0.5 }}
                animate={{ x: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-glow-cyan">
                  <Key className="w-6 h-6 text-cyan-300 -rotate-45" />
                </div>
                <span className="text-[10px] font-mono text-cyan-400 mt-1 font-semibold tracking-wider">
                  KEY_A (Alice)
                </span>
              </motion.div>

              {/* Energy Beam Exchange */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
                className="relative flex-1 mx-4 h-[3px] bg-gradient-to-r from-[#00E5FF] via-white to-[#8B5CF6] shadow-[0_0_15px_#00E5FF]"
              >
                <motion.div
                  animate={{ x: ['0%', '100%', '0%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-1.5 w-3 h-3 rounded-full bg-white shadow-glow-cyan"
                />
              </motion.div>

              {/* Key B - Bob (Purple) */}
              <motion.div
                initial={{ x: 40, scale: 0.5 }}
                animate={{ x: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-950/80 border-2 border-purple-400 flex items-center justify-center shadow-glow-purple">
                  <Key className="w-6 h-6 text-purple-300 rotate-135" />
                </div>
                <span className="text-[10px] font-mono text-purple-400 mt-1 font-semibold tracking-wider">
                  KEY_B (Bob)
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Shield Icon Core */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0b0f24] to-[#050711] border border-cyan-500/50 flex items-center justify-center shadow-glow-cyan-lg"
            >
              <Shield className="w-10 h-10 text-cyber-cyan" />
              <Zap className="absolute w-4 h-4 text-purple-400 animate-ping" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PHASE 6: Logo Materialization */}
      <AnimatePresence>
        {phase >= 6 && (
          <motion.div
            initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center mt-6 z-10 text-center"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-wider font-cyber bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,229,255,0.5)]">
                CIPHERLINK
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-mono text-cyan-300/80 tracking-[0.25em] uppercase mt-2">
              Next-Gen ECC Secure File Transfer
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 7: Tagline */}
      <AnimatePresence>
        {phase >= 7 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-4 z-10 text-center px-4"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-xs sm:text-sm font-mono text-cyan-200 tracking-widest uppercase shadow-glow-cyan">
              &ldquo;SECURE YOUR DIGITAL WORLD&rdquo;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHASE 8: ENTER SYSTEM Button */}
      <AnimatePresence>
        {phase >= 8 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="mt-8 z-10"
          >
            <button
              onClick={handleEnter}
              className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 font-cyber text-lg font-bold tracking-widest text-white shadow-glow-cyan-lg hover:shadow-[0_0_40px_rgba(0,229,255,0.8)] transition-all duration-300 flex items-center gap-3 overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                ENTER SYSTEM <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

