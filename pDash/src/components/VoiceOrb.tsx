import { useRef, useEffect, useCallback } from 'react';
import type { OrbState } from '../hooks/useVoiceInput';

interface VoiceOrbProps {
  state: OrbState;
  onTap: () => void;
  size?: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  phase: number;
}

// Blue-based color palettes for light theme
const STATE_COLORS: Record<OrbState, { r: number; g: number; b: number }[]> = {
  idle: [
    { r: 37, g: 99, b: 235 },   // primary blue
    { r: 59, g: 130, b: 246 },   // blue-400
    { r: 99, g: 102, b: 241 },   // indigo
  ],
  listening: [
    { r: 37, g: 99, b: 235 },   // primary blue
    { r: 16, g: 185, b: 129 },  // emerald
    { r: 6, g: 182, b: 212 },   // cyan
  ],
  processing: [
    { r: 37, g: 99, b: 235 },   // primary
    { r: 99, g: 102, b: 241 },  // indigo
    { r: 139, g: 92, b: 246 },  // purple
  ],
  speaking: [
    { r: 16, g: 185, b: 129 },  // emerald
    { r: 34, g: 197, b: 94 },   // green
    { r: 37, g: 99, b: 235 },   // blue
  ],
};

export function VoiceOrb({ state, onTap, size = 280 }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const initParticles = useCallback((count: number, radius: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      particles.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.25;

    particlesRef.current = initParticles(200, baseRadius);

    const animate = (time: number) => {
      timeRef.current = time * 0.001;
      const t = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      const colors = STATE_COLORS[state];
      const particles = particlesRef.current;

      let speedMultiplier = 1;
      let radiusMultiplier = 1;
      let glowRadius = baseRadius * 1.6;
      let glowAlpha = 0.06;

      switch (state) {
        case 'idle':
          speedMultiplier = 0.4;
          radiusMultiplier = 1 + Math.sin(t * 0.8) * 0.04;
          glowAlpha = 0.05 + Math.sin(t * 0.8) * 0.02;
          break;
        case 'listening':
          speedMultiplier = 2.5;
          radiusMultiplier = 1 + Math.sin(t * 3) * 0.1;
          glowRadius = baseRadius * 2.2;
          glowAlpha = 0.1;
          break;
        case 'processing':
          speedMultiplier = 1.5;
          radiusMultiplier = 1 + Math.sin(t * 4) * 0.03;
          glowAlpha = 0.08;
          break;
        case 'speaking':
          speedMultiplier = 1.2;
          radiusMultiplier = 1 + Math.sin(t * 2) * 0.12;
          glowRadius = baseRadius * 2.4;
          glowAlpha = 0.12;
          break;
      }

      // Outer glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, baseRadius * 0.3,
        centerX, centerY, glowRadius
      );
      gradient.addColorStop(0, `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, ${glowAlpha})`);
      gradient.addColorStop(0.6, `rgba(${colors[1].r}, ${colors[1].g}, ${colors[1].b}, ${glowAlpha * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Ripple rings for listening
      if (state === 'listening') {
        for (let r = 0; r < 3; r++) {
          const ripplePhase = (t * 2 + r * 0.8) % 3;
          const rippleRadius = baseRadius + ripplePhase * baseRadius * 0.7;
          const rippleAlpha = Math.max(0, 0.25 - ripplePhase * 0.08);

          ctx.beginPath();
          ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, ${rippleAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Rotating arc for processing
      if (state === 'processing') {
        const arcRadius = baseRadius * 1.35;
        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, t * 3, t * 3 + Math.PI * 0.8);
        ctx.strokeStyle = `rgba(${colors[2].r}, ${colors[2].g}, ${colors[2].b}, 0.4)`;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, arcRadius, t * 3 + Math.PI, t * 3 + Math.PI + Math.PI * 0.5);
        ctx.strokeStyle = `rgba(${colors[0].r}, ${colors[0].g}, ${colors[0].b}, 0.2)`;
        ctx.stroke();
      }

      // Rotate and render particles
      const rotationSpeed = 0.2 * speedMultiplier;
      const sortedParticles = [...particles].sort((a, b) => a.z - b.z);

      for (const p of sortedParticles) {
        const cos = Math.cos(rotationSpeed * 0.01);
        const sin = Math.sin(rotationSpeed * 0.01);
        const newX = p.baseX * cos - p.baseZ * sin;
        const newZ = p.baseX * sin + p.baseZ * cos;
        p.baseX = newX;
        p.baseZ = newZ;

        const drift = Math.sin(t * speedMultiplier + p.phase) * 3 * radiusMultiplier;
        p.x = p.baseX * radiusMultiplier + drift * p.vx;
        p.y = p.baseY * radiusMultiplier + drift * p.vy;
        p.z = p.baseZ * radiusMultiplier;

        const perspective = 300;
        const scale = perspective / (perspective + p.z);
        const screenX = centerX + p.x * scale;
        const screenY = centerY + p.y * scale;

        const depthAlpha = 0.3 + (p.z + baseRadius) / (baseRadius * 2) * 0.7;
        const dotSize = p.size * scale * (state === 'speaking' ? 1.4 : 1);

        const colorIdx = Math.floor((p.phase / (Math.PI * 2)) * colors.length) % colors.length;
        const color = colors[colorIdx];

        ctx.beginPath();
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * p.alpha})`;
        ctx.fill();

        if (p.alpha > 0.7) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, dotSize * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${depthAlpha * 0.06})`;
          ctx.fill();
        }
      }

      // Speaking burst
      if (state === 'speaking') {
        const burstAlpha = 0.03 + Math.sin(t * 3) * 0.02;
        const burstGrad = ctx.createRadialGradient(
          centerX, centerY, 0, centerX, centerY, baseRadius * 2
        );
        burstGrad.addColorStop(0, `rgba(16, 185, 129, ${burstAlpha})`);
        burstGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = burstGrad;
        ctx.fillRect(0, 0, size, size);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [state, size, initParticles]);

  return (
    <button
      id="voice-orb-button"
      onClick={onTap}
      className="relative cursor-pointer focus:outline-none active:scale-95 transition-transform duration-150"
      aria-label={state === 'listening' ? 'Stop listening' : 'Start voice input'}
    >
      <canvas
        ref={canvasRef}
        className="orb-canvas"
        style={{ width: size, height: size }}
      />
    </button>
  );
}
