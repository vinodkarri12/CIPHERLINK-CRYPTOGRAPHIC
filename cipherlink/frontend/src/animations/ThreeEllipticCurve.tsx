import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Sparkles, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  curveType?: 'SECP256R1' | 'X25519';
}

export const ThreeEllipticCurve: React.FC<Props> = ({ curveType = 'SECP256R1' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [scalarK, setScalarK] = useState<number>(7);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Grid helper
    const gridHelper = new THREE.GridHelper(24, 24, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = -4;
    (gridHelper.material as THREE.Material).opacity = 0.25;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Generate Elliptic Curve Points: y^2 = x^3 - 3x + 4
    // y = ± sqrt(x^3 - 3x + 4) for x in [-2.2, 3.5]
    const upperPoints: THREE.Vector3[] = [];
    const lowerPoints: THREE.Vector3[] = [];

    const xMin = -2.15;
    const xMax = 3.2;
    const steps = 180;

    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const rhs = x * x * x - 3 * x + 4;
      if (rhs >= 0) {
        const y = Math.sqrt(rhs);
        upperPoints.push(new THREE.Vector3(x * 2.8, y * 1.8, 0));
        lowerPoints.push(new THREE.Vector3(x * 2.8, -y * 1.8, 0));
      }
    }

    // Curve Line Upper
    const upperGeom = new THREE.BufferGeometry().setFromPoints(upperPoints);
    const upperMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 });
    const upperLine = new THREE.Line(upperGeom, upperMat);
    scene.add(upperLine);

    // Curve Line Lower
    const lowerGeom = new THREE.BufferGeometry().setFromPoints(lowerPoints);
    const lowerMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, linewidth: 2 });
    const lowerLine = new THREE.Line(lowerGeom, lowerMat);
    scene.add(lowerLine);

    // Glow points around curve
    const glowParticlesGeom = new THREE.BufferGeometry();
    const glowCoords: number[] = [];
    [...upperPoints, ...lowerPoints].forEach((pt) => {
      for (let k = 0; k < 3; k++) {
        glowCoords.push(
          pt.x + (Math.random() - 0.5) * 0.4,
          pt.y + (Math.random() - 0.5) * 0.4,
          pt.z + (Math.random() - 0.5) * 1.2
        );
      }
    });
    glowParticlesGeom.setAttribute('position', new THREE.Float32BufferAttribute(glowCoords, 3));
    const glowParticlesMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
    });
    const glowCloud = new THREE.Points(glowParticlesGeom, glowParticlesMat);
    scene.add(glowCloud);

    // Point G (Generator Point)
    const gGeom = new THREE.SphereGeometry(0.35, 24, 24);
    const gMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const gMesh = new THREE.Mesh(gGeom, gMat);
    const gPos = upperPoints[Math.floor(upperPoints.length * 0.28)] || new THREE.Vector3(-1.5, 3.2, 0);
    gMesh.position.copy(gPos);
    scene.add(gMesh);

    // Point P = d*G (Private key scalar product)
    const pGeom = new THREE.SphereGeometry(0.42, 24, 24);
    const pMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const pMesh = new THREE.Mesh(pGeom, pMat);
    const pPos = upperPoints[Math.floor(upperPoints.length * 0.72)] || new THREE.Vector3(3.8, 5.1, 0);
    pMesh.position.copy(pPos);
    scene.add(pMesh);

    // Tangent / Secant Connection Line
    const secantGeom = new THREE.BufferGeometry().setFromPoints([gPos, pPos]);
    const secantMat = new THREE.LineDashedMaterial({
      color: 0x10b981,
      dashSize: 0.5,
      gapSize: 0.2,
      linewidth: 1.5,
    });
    const secantLine = new THREE.Line(secantGeom, secantMat);
    secantLine.computeLineDistances();
    scene.add(secantLine);

    // Group for rotation
    const curveGroup = new THREE.Group();
    curveGroup.add(upperLine);
    curveGroup.add(lowerLine);
    curveGroup.add(glowCloud);
    curveGroup.add(gMesh);
    curveGroup.add(pMesh);
    curveGroup.add(secantLine);
    scene.add(curveGroup);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      curveGroup.rotation.y = Math.sin(elapsed * 0.3) * 0.25;
      curveGroup.rotation.x = Math.cos(elapsed * 0.2) * 0.08;

      // Pulse Point G & P
      const scaleG = 1 + Math.sin(elapsed * 3) * 0.15;
      gMesh.scale.set(scaleG, scaleG, scaleG);

      const scaleP = 1 + Math.cos(elapsed * 3.5) * 0.15;
      pMesh.scale.set(scaleP, scaleP, scaleP);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    // Mouse drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      curveGroup.rotation.y += deltaX * 0.008;
      curveGroup.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Resize
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [curveType, scalarK]);

  return (
    <div className="relative w-full h-[450px] rounded-xl overflow-hidden glass-panel border border-cyan-500/30 group">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Cyber HUD Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-bg/80 border border-cyan-500/30 backdrop-blur-md">
          <Shield className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span className="font-mono text-xs text-cyber-cyan font-bold tracking-wider">
            {curveType === 'SECP256R1' ? 'WEIERSTRASS CURVE y² ≡ x³ - 3x + b (mod p)' : 'MONTGOMERY CURVE v² = u³ + Au² + u'}
          </span>
        </div>
        <p className="text-[11px] font-mono text-slate-400 mt-1 pl-1">
          Drag to rotate 3D curve in real time • NIST P-256 Prime Field
        </p>
      </div>

      {/* Legend & Points Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/70 border border-cyan-500/40 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan shadow-glow-cyan"></span>
          <span className="text-cyan-200">Generator Point G (Base)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/70 border border-purple-500/40 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-purple shadow-glow-purple"></span>
          <span className="text-purple-200">Public Point Q = d · G</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/70 border border-emerald-500/40 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-emerald-300">Secant Chord (Point Add)</span>
        </div>
      </div>

      {/* Interactive Scalar Stepper */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-black/75 border border-cyan-500/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-300">
            Scalar Multiplication Steps: <strong className="text-cyber-cyan">k = {scalarK}</strong>
          </span>
          <button
            onClick={() => setScalarK((prev) => (prev >= 15 ? 3 : prev + 2))}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 rounded transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Step Forward (Double-and-Add)
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Security: <span className="text-cyber-cyan font-bold">128-bit Parity</span> with RSA-3072
        </div>
      </div>
    </div>
  );
};

