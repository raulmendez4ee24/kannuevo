/**
 * Particle cloud that follows the cursor — pure Canvas 2D, zero WebGL.
 */
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function InteractiveSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PARTICLE_COUNT = 600;
    const particles = particlesRef.current;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Init particles in a sphere-like cluster
    while (particles.length < PARTICLE_COUNT) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.35;
      particles.push({
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.001,
        vy: (Math.random() - 0.5) * 0.001,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 300,
      });
    }

    function handleMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
      mouseRef.current.active = true;
    }

    function handleLeave() {
      mouseRef.current.active = false;
    }

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseleave', handleLeave);

    function animate() {
      const rect = canvas!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx!.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const isActive = mouseRef.current.active;

      // Attract center (cursor if active, otherwise center)
      const cx = isActive ? mx : 0.5;
      const cy = isActive ? my : 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Attraction to center
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = isActive ? 0.0008 : 0.0003;
        p.vx += dx * force;
        p.vy += dy * force;

        // Slight orbit/swirl
        p.vx += -dy * 0.00015;
        p.vy += dx * 0.00015;

        // Damping
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Repulsion from center (prevent collapse)
        if (dist < 0.05) {
          const repel = (0.05 - dist) * 0.01;
          p.vx -= dx * repel;
          p.vy -= dy * repel;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Life cycle
        p.life += 1;
        if (p.life > p.maxLife) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 0.3 + 0.1;
          p.x = cx + Math.cos(angle) * r;
          p.y = cy + Math.sin(angle) * r;
          p.vx = (Math.random() - 0.5) * 0.002;
          p.vy = (Math.random() - 0.5) * 0.002;
          p.life = 0;
          p.maxLife = 200 + Math.random() * 300;
        }

        // Alpha based on life + distance
        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(lifeRatio * 5, 1);
        const fadeOut = lifeRatio > 0.8 ? 1 - (lifeRatio - 0.8) * 5 : 1;
        const distAlpha = Math.max(0, 1 - dist * 2);
        const a = p.alpha * fadeIn * fadeOut * (0.3 + distAlpha * 0.7);

        // Color: mix cyan and white with occasional purple
        const px = p.x * w;
        const py = p.y * h;

        if (p.size > 1.8) {
          // Brighter/larger = cyan glow
          ctx!.fillStyle = `rgba(0, 240, 255, ${a * 0.9})`;
          ctx!.shadowColor = 'rgba(0, 240, 255, 0.5)';
          ctx!.shadowBlur = 6;
        } else if (p.size < 0.8) {
          // Tiny = purple tint
          ctx!.fillStyle = `rgba(180, 120, 255, ${a * 0.7})`;
          ctx!.shadowColor = 'transparent';
          ctx!.shadowBlur = 0;
        } else {
          ctx!.fillStyle = `rgba(220, 230, 255, ${a * 0.8})`;
          ctx!.shadowColor = 'transparent';
          ctx!.shadowBlur = 0;
        }

        ctx!.beginPath();
        ctx!.arc(px, py, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[360px] lg:min-h-[500px] flex items-center justify-center relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {/* Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest text-ghost-white/50 z-10">
        [ NUCLEO KAN LOGIC ]
      </div>
    </div>
  );
}
