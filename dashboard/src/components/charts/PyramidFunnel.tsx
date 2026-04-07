"use client";

import { useEffect, useRef } from "react";
import type { FunnelStep } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/constants";

interface PyramidFunnelProps {
  steps: FunnelStep[];
  className?: string;
}

const STAGES = [
  { label: "rgba(34,211,238,0.90)",  edge: "rgba(34,211,238,0.35)",  grad: ["#22d3ee", "#06b6d4"] },
  { label: "rgba(45,212,191,0.85)",  edge: "rgba(45,212,191,0.30)",  grad: ["#2dd4bf", "#14b8a6"] },
  { label: "rgba(59,130,246,0.85)",  edge: "rgba(59,130,246,0.30)",  grad: ["#3b82f6", "#2563eb"] },
  { label: "rgba(99,102,241,0.85)",  edge: "rgba(99,102,241,0.30)",  grad: ["#6366f1", "#4f46e5"] },
  { label: "rgba(139,92,246,0.85)",  edge: "rgba(139,92,246,0.30)",  grad: ["#8b5cf6", "#7c3aed"] },
  { label: "rgba(167,139,250,0.85)", edge: "rgba(167,139,250,0.25)", grad: ["#a78bfa", "#8b5cf6"] },
  { label: "rgba(52,211,153,0.90)",  edge: "rgba(52,211,153,0.40)",  grad: ["#34d399", "#10b981"] },
];

// ── Particle system ──

interface Particle {
  x: number;
  y: number;
  vx: number;
  phase: "entering" | "exiting";
  opacity: number;
  size: number;
}

function createParticles(
  count: number,
  funnelTop: number,
  funnelBot: number,
  funnelLeft: number,
  funnelRight: number,
  exitY1: number,
  exitY2: number,
): Particle[] {
  const particles: Particle[] = [];
  const funnelW = funnelRight - funnelLeft;

  // Entering particles (grey, many)
  for (let i = 0; i < count; i++) {
    const progress = Math.random();
    const x = funnelLeft + progress * funnelW * 0.85;
    // At this x, compute the funnel height bounds
    const t = (x - funnelLeft) / funnelW;
    const halfH = ((funnelBot - funnelTop) / 2) * (1 - t * 0.75);
    const midY = (funnelTop + funnelBot) / 2;
    const y = midY + (Math.random() - 0.5) * 2 * halfH * 0.85;

    particles.push({
      x,
      y,
      vx: 0.3 + Math.random() * 0.6,
      phase: "entering",
      opacity: 0.25 + Math.random() * 0.35,
      size: 1.5 + Math.random() * 1.5,
    });
  }

  // Exiting particles (green, 2-3)
  const exitCount = 2 + Math.round(Math.random());
  for (let i = 0; i < exitCount; i++) {
    const x = funnelRight - 10 + Math.random() * 30;
    const y = exitY1 + Math.random() * (exitY2 - exitY1);
    particles.push({
      x,
      y,
      vx: 0.4 + Math.random() * 0.5,
      phase: "exiting",
      opacity: 0.7 + Math.random() * 0.3,
      size: 2.5 + Math.random() * 1,
    });
  }

  return particles;
}

export function PyramidFunnel({ steps, className }: PyramidFunnelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const count = steps.length;

  // ── Dimensions ──
  const svgW = 900;
  const svgH = 420;
  const funnelLeft = 50;
  const funnelRight = svgW - 50;
  const funnelTop = 30;
  const funnelBot = svgH - 30;
  const funnelW = funnelRight - funnelLeft;
  const midY = (funnelTop + funnelBot) / 2;

  // Exit opening
  const exitHalf = (funnelBot - funnelTop) * 0.125;
  const exitY1 = midY - exitHalf;
  const exitY2 = midY + exitHalf;

  // Stage boundaries (left-to-right)
  function getStageX(index: number): number {
    return funnelLeft + (funnelW / count) * index;
  }

  function getFunnelY(x: number): { top: number; bot: number } {
    const t = Math.min(1, Math.max(0, (x - funnelLeft) / funnelW));
    const halfH = ((funnelBot - funnelTop) / 2) * (1 - t * 0.75);
    return { top: midY - halfH, bot: midY + halfH };
  }

  // ── Canvas particle animation ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hi-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const scaleX = rect.width / svgW;
    const scaleY = rect.height / svgH;

    particlesRef.current = createParticles(
      55, funnelTop, funnelBot, funnelLeft, funnelRight, exitY1, exitY2,
    );

    function tick() {
      if (!ctx || !canvas) return;
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.x += p.vx;

        // Constrain y within funnel bounds at current x
        const bounds = getFunnelY(p.x);
        if (p.y < bounds.top + 4) p.y = bounds.top + 4;
        if (p.y > bounds.bot - 4) p.y = bounds.bot - 4;

        // Add slight y drift toward center as funnel narrows
        const t = (p.x - funnelLeft) / funnelW;
        p.y += (midY - p.y) * t * 0.008;

        // Wrap around when exiting canvas
        if (p.x > funnelRight + 60) {
          if (p.phase === "entering") {
            // Reset entering particles at left
            p.x = funnelLeft - 10 - Math.random() * 30;
            const halfH = (funnelBot - funnelTop) / 2;
            p.y = midY + (Math.random() - 0.5) * 2 * halfH * 0.85;
            p.vx = 0.3 + Math.random() * 0.6;
          } else {
            // Reset exiting at right edge of funnel
            p.x = funnelRight - 10;
            p.y = exitY1 + Math.random() * (exitY2 - exitY1);
            p.vx = 0.4 + Math.random() * 0.5;
          }
        }

        // Fade in/out at edges
        let alpha = p.opacity;
        if (p.x < funnelLeft + 20) alpha *= Math.max(0, (p.x - funnelLeft + 10) / 30);
        if (p.x > funnelRight - 10) {
          if (p.phase === "entering") alpha *= Math.max(0, 1 - (p.x - funnelRight + 20) / 40);
        }

        // Draw
        const sx = p.x * scaleX;
        const sy = p.y * scaleY;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * scaleX, 0, Math.PI * 2);

        if (p.phase === "exiting") {
          ctx.fillStyle = `rgba(52,211,153,${alpha})`;
          // Glow for exiting
          ctx.shadowColor = "rgba(52,211,153,0.5)";
          ctx.shadowBlur = 6 * scaleX;
        } else {
          ctx.fillStyle = `rgba(180,190,210,${alpha})`;
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [count]);

  if (count === 0) return null;

  // ── Build SVG trapezoid points for horizontal funnel ──
  function getStagePolygon(index: number): string {
    const x1 = getStageX(index);
    const x2 = getStageX(index + 1);
    const b1 = getFunnelY(x1);
    const b2 = getFunnelY(x2);
    return `${x1},${b1.top} ${x2},${b2.top} ${x2},${b2.bot} ${x1},${b1.bot}`;
  }

  return (
    <div className={className}>
      <div className="relative w-full" style={{ aspectRatio: `${svgW} / ${svgH}` }}>
        {/* SVG layer */}
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Conversion funnel pyramid"
        >
          <defs>
            {STAGES.map((s, i) => (
              <linearGradient key={`pfg${i}`} id={`pfg${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={s.grad[0]} stopOpacity="0.85" />
                <stop offset="100%" stopColor={s.grad[1]} stopOpacity="0.75" />
              </linearGradient>
            ))}
            <filter id="pf-edge-glow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
            {/* Left rim glow */}
            <linearGradient id="pf-rim-h" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left opening rim */}
          <ellipse
            cx={funnelLeft}
            cy={midY}
            rx={10}
            ry={(funnelBot - funnelTop) / 2}
            fill="url(#pf-rim-h)"
          />

          {/* Stage trapezoids */}
          {steps.map((step, i) => {
            const stage = STAGES[i % STAGES.length];
            const points = getStagePolygon(i);
            const x1 = getStageX(i);
            const x2 = getStageX(i + 1);
            const xMid = (x1 + x2) / 2;
            const b = getFunnelY(xMid);
            const cy = midY;

            return (
              <g
                key={step.key}
                style={{
                  opacity: 0,
                  animation: `pfSlideH 0.4s cubic-bezier(0.4,0,0.2,1) ${i * 60 + 80}ms forwards`,
                }}
              >
                {/* Trapezoid */}
                <polygon
                  points={points}
                  fill={`url(#pfg${i % STAGES.length})`}
                />

                {/* Top edge line */}
                <line
                  x1={x1} y1={getFunnelY(x1).top}
                  x2={x2} y2={getFunnelY(x2).top}
                  stroke={stage.edge}
                  strokeWidth="1"
                  filter="url(#pf-edge-glow)"
                />

                {/* Separator line between stages */}
                {i > 0 && (
                  <line
                    x1={x1} y1={getFunnelY(x1).top}
                    x2={x1} y2={getFunnelY(x1).bot}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="0.5"
                  />
                )}

                {/* ── Label ── */}
                <text
                  x={xMid}
                  y={b.top - 10}
                  textAnchor="middle"
                  fill={stage.label}
                  fontSize="10"
                  fontFamily="var(--font-sans), Inter, system-ui, sans-serif"
                  fontWeight="600"
                  letterSpacing="0.05em"
                >
                  {step.label.toUpperCase()}
                </text>

                {/* ── Value ── */}
                <text
                  x={xMid}
                  y={cy + 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize="20"
                  fontFamily="var(--font-sans), Inter, system-ui, sans-serif"
                  fontWeight="700"
                  letterSpacing="-0.01em"
                >
                  {formatNumber(step.value)}
                </text>

                {/* ── Conversion % ── */}
                <text
                  x={xMid}
                  y={cy + 20}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.30)"
                  fontSize="10"
                  fontFamily="var(--font-mono), monospace"
                >
                  {i === 0
                    ? "100%"
                    : step.conversion_from_top !== null
                      ? formatPercent(step.conversion_from_top)
                      : "—"}
                </text>

                {/* ── Drop-off below ── */}
                {i > 0 && step.drop_off_percent !== null && (
                  <text
                    x={xMid}
                    y={b.bot + 18}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.60)"
                    fontSize="10"
                    fontFamily="var(--font-mono), monospace"
                    fontWeight="500"
                  >
                    −{formatPercent(step.drop_off_percent)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Right cap ellipse (emerald) */}
          {(() => {
            const lastX = getStageX(count);
            const b = getFunnelY(lastX);
            return (
              <ellipse
                cx={lastX}
                cy={midY}
                rx={4}
                ry={(b.bot - b.top) / 2}
                fill="#10b981"
                opacity="0.3"
              />
            );
          })()}

          {/* Keyframes */}
          <style>{`
            @keyframes pfSlideH {
              from { opacity: 0; transform: translateX(-12px); }
              to   { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </svg>

        {/* Canvas particle layer (on top) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: "screen" }}
        />
      </div>
    </div>
  );
}
