import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Radio, Laptop, Smartphone, Server, Plane } from 'lucide-react';
import { DeviceSlotModel, MultiDeviceTransferEvent } from '../services/api';

interface Props {
  devices: DeviceSlotModel[];
  activeTransfers: MultiDeviceTransferEvent[];
  selectedDevice: string;
  onSelectDevice: (deviceId: string) => void;
  authorizedPairs: Set<string>;
}

export const NetworkMeshVisualizer: React.FC<Props> = ({
  devices,
  activeTransfers,
  selectedDevice,
  onSelectDevice,
  authorizedPairs,
}) => {
  // Coordinates for the 4 devices in an SVG coordinate system (viewBox 0 0 500 360)
  // Center is (250, 180)
  const nodePositions: Record<string, { x: number; y: number; icon: React.ReactNode; color: string; border: string }> = {
    'DEV-1': { x: 250, y: 55, icon: <Laptop className="w-5 h-5" />, color: '#00E5FF', border: 'border-cyan-400' },
    'DEV-2': { x: 410, y: 180, icon: <Smartphone className="w-5 h-5" />, color: '#8B5CF6', border: 'border-purple-400' },
    'DEV-3': { x: 250, y: 305, icon: <Server className="w-5 h-5" />, color: '#10B981', border: 'border-emerald-400' },
    'DEV-4': { x: 90, y: 180, icon: <Plane className="w-5 h-5" />, color: '#F59E0B', border: 'border-amber-400' },
  };

  // All 6 potential links in the 4-device complete graph K_4
  const allSixLinks = [
    { a: 'DEV-1', b: 'DEV-2' },
    { a: 'DEV-1', b: 'DEV-3' },
    { a: 'DEV-1', b: 'DEV-4' },
    { a: 'DEV-2', b: 'DEV-3' },
    { a: 'DEV-2', b: 'DEV-4' },
    { a: 'DEV-3', b: 'DEV-4' },
  ];

  const isPairAuthorized = (a: string, b: string) => {
    const key1 = `${minDev(a, b)}_${maxDev(a, b)}`;
    return authorizedPairs.has(key1);
  };

  const isTransferActiveBetween = (a: string, b: string) => {
    return activeTransfers.some(
      (t) =>
        t.status === 'TRANSFERRING' &&
        ((t.sender_id === a && t.receiver_id === b) || (t.sender_id === b && t.receiver_id === a))
    );
  };

  function minDev(a: string, b: string) {
    return a < b ? a : b;
  }
  function maxDev(a: string, b: string) {
    return a > b ? a : b;
  }

  return (
    <div className="relative w-full h-[360px] rounded-2xl glass-panel-glow border border-cyan-500/30 overflow-hidden flex items-center justify-center select-none">
      {/* Background Circuit Grid & Rings */}
      <div className="absolute inset-0 circuit-grid opacity-25" />
      <div className="absolute w-72 h-72 rounded-full border border-cyan-500/10 pointer-events-none animate-spin-slow" />
      <div className="absolute w-96 h-96 rounded-full border border-purple-500/10 pointer-events-none" />

      {/* SVG Layer for Links & Packets */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 360">
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central Cryptographic Coordinator Hub */}
        <circle cx="250" cy="180" r="28" fill="#0b0f24" stroke="#00E5FF" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
        <text x="250" y="184" textAnchor="middle" fill="#00E5FF" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
          ECDH HUB
        </text>

        {/* 6 Network Mesh Link Lines */}
        {allSixLinks.map((link, idx) => {
          const posA = nodePositions[link.a];
          const posB = nodePositions[link.b];
          const authorized = isPairAuthorized(link.a, link.b);
          const active = isTransferActiveBetween(link.a, link.b);

          return (
            <g key={idx}>
              <line
                x1={posA.x}
                y1={posA.y}
                x2={posB.x}
                y2={posB.y}
                stroke={active ? '#00E5FF' : authorized ? 'rgba(0, 229, 255, 0.4)' : 'rgba(71, 85, 105, 0.25)'}
                strokeWidth={active ? 2.5 : authorized ? 1.5 : 1}
                strokeDasharray={authorized && !active ? '4 4' : undefined}
                filter={active ? 'url(#glow-cyan)' : undefined}
              />

              {/* Streaming Data Packet Animation when Transfer is Active */}
              {active && (
                <motion.circle
                  r="5"
                  fill="#00E5FF"
                  filter="url(#glow-cyan)"
                  animate={{
                    cx: [posA.x, posB.x],
                    cy: [posA.y, posB.y],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 4 Interactive Device Nodes Overlay */}
      {devices.map((dev) => {
        const pos = nodePositions[dev.device_id] || { x: 250, y: 180, icon: <Radio />, color: '#00E5FF', border: 'border-cyan-400' };
        const isSelected = selectedDevice === dev.device_id;
        const isOnline = dev.status !== 'OFFLINE';
        const isTransferring = dev.status === 'TRANSFERRING';

        // Calculate CSS percentage positions based on 500x360 coordinate system
        const leftPercent = `${(pos.x / 500) * 100}%`;
        const topPercent = `${(pos.y / 360) * 100}%`;

        return (
          <div
            key={dev.device_id}
            onClick={() => onSelectDevice(dev.device_id)}
            style={{ left: leftPercent, top: topPercent }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
          >
            <div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isSelected
                  ? 'bg-cyan-950/90 border-2 border-cyan-300 shadow-glow-cyan-lg scale-110'
                  : 'bg-slate-900/80 border border-slate-700/70 hover:border-cyan-400/80 hover:scale-105'
              }`}
            >
              <div style={{ color: pos.color }}>{pos.icon}</div>

              {/* Live Status Pip */}
              <span
                className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
                  isTransferring
                    ? 'bg-cyan-400 animate-ping'
                    : isOnline
                    ? 'bg-emerald-400'
                    : 'bg-rose-500'
                }`}
              />
            </div>

            {/* Device Label Tooltip */}
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-center pointer-events-none">
              <div className="text-[11px] font-cyber font-bold text-white tracking-wide">
                {dev.device_id}
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                {dev.ip_address}
              </div>
            </div>
          </div>
        );
      })}

      {/* Topology Legend HUD Overlay */}
      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-400 bg-black/75 px-3 py-1.5 rounded-lg border border-cyan-500/20 pointer-events-none flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Online
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping" /> Transferring
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Authenticated ECDH Link
        </span>
      </div>
    </div>
  );
};

