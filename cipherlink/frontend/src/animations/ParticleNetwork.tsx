import React, { useEffect, useRef } from 'react';

export const ParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(width > 768 ? 65 : 35, 80);
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
    }

    const particles: Particle[] = [];
    const colors = ['#00E5FF', '#8B5CF6', '#6366F1'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    // Circuit grid traces
    interface Trace {
      x: number;
      y: number;
      length: number;
      dir: 'H' | 'V';
      speed: number;
      progress: number;
    }
    const traces: Trace[] = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 150 + 50,
      dir: Math.random() > 0.5 ? 'H' : 'V',
      speed: Math.random() * 1.5 + 0.5,
      progress: 0,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle circuit traces
      ctx.lineWidth = 1;
      traces.forEach((t) => {
        t.progress += t.speed;
        if (t.progress > t.length) {
          t.progress = 0;
          t.x = Math.random() * width;
          t.y = Math.random() * height;
          t.dir = Math.random() > 0.5 ? 'H' : 'V';
        }
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.beginPath();
        if (t.dir === 'H') {
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(t.x + t.progress, t.y);
        } else {
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(t.x, t.y + t.progress);
        }
        ctx.stroke();
      });

      // Update & render particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Render point
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby points
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  );
};

