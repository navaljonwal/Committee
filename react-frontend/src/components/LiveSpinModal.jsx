import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Trophy, Award, X, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

const SLICE_COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#eab308', '#6366f1', '#14b8a6', '#f43f5e',
  '#84cc16', '#a855f7', '#0284c7', '#d97706', '#059669'
];

// Zero-dependency sound effects using standard Web Audio API
function playTickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // silent fallback
  }
}

function playWinFanfare() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.11);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch {
    // silent fallback
  }
}

export default function LiveSpinModal({ spinData, onClose }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [transitionDurationSec, setTransitionDurationSec] = useState((spinData?.duration_ms || 7000) / 1000);
  const [isSpinning, setIsSpinning] = useState(true);
  const [showWinnerCard, setShowWinnerCard] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(8);

  const canvasRef = useRef(null);

  const schedule_id = spinData?.schedule_id;
  const month_no = spinData?.month_no;
  const committee_name = spinData?.committee_name;
  const candidates = spinData?.candidates || [];
  const winner_id = spinData?.winner_id;
  const winner_name = spinData?.winner_name;
  const duration_ms = spinData?.duration_ms || 7000;
  const started_at = spinData?.started_at || Date.now();

  // Find winner slice index
  const numCandidates = Math.max(1, candidates.length);
  const winnerIndex = candidates.findIndex(c => Number(c.id) === Number(winner_id));
  const safeWinnerIndex = winnerIndex >= 0 ? winnerIndex : 0;

  // Calculate target rotation to bring winner slice precisely under top pointer (0 deg / 360 deg)
  const sliceAngle = 360 / numCandidates;
  const winnerMidAngle = (safeWinnerIndex + 0.5) * sliceAngle;
  const targetAngle = (360 - winnerMidAngle) % 360;
  const fullRounds = 8 * 360; // 8 full spins for exciting suspense
  const finalRotation = fullRounds + targetAngle;

  // High-performance Canvas Confetti Particle Generator
  const triggerConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      r: Math.random() * 6 + 3,
      dx: (Math.random() - 0.5) * 16,
      dy: (Math.random() - 0.7) * 18,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10,
      tiltSpeed: Math.random() * 0.1 + 0.05,
      opacity: 1
    }));

    const startTime = Date.now();

    function render() {
      const elapsed = Date.now() - startTime;
      if (elapsed > 4500) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.35; // gravity
        p.dx *= 0.985; // friction
        p.tilt += p.tiltSpeed;
        p.opacity = Math.max(0, 1 - (elapsed / 4500));

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * Math.cos(p.tilt), p.tilt, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(render);
    }

    render();
  }, []);

  useEffect(() => {
    if (!spinData) return;
    const now = Date.now();
    const elapsedMs = now - started_at;
    const remainingMs = Math.max(0, duration_ms - elapsedMs);

    if (remainingMs <= 0) {
      // Spin already finished (e.g. user refreshed or joined late)
      setRotationDeg(finalRotation);
      setTransitionDurationSec(0);
      setIsSpinning(false);
      setShowWinnerCard(true);
      return;
    }

    // Set transition duration matching remaining milliseconds for zero-lag sync across all devices
    const durSec = remainingMs / 1000;
    setTransitionDurationSec(durSec);

    // Trigger CSS rotation on next tick
    const startTimeout = setTimeout(() => {
      setRotationDeg(finalRotation);
    }, 50);

    // Audio ticker sequence during spin
    const tickIntervals = [
      60, 60, 60, 70, 70, 80, 80, 90, 100, 120, 
      140, 160, 190, 220, 260, 310, 370, 440, 520, 620, 
      740, 880, 1050
    ];

    let tickTimer = null;
    function scheduleNextTick(index) {
      if (index >= tickIntervals.length || !isSpinning) return;
      if (soundEnabled) playTickSound();
      tickTimer = setTimeout(() => {
        scheduleNextTick(index + 1);
      }, tickIntervals[index]);
    }

    if (soundEnabled) {
      scheduleNextTick(0);
    }

    // When spin finishes
    const finishTimeout = setTimeout(() => {
      setIsSpinning(false);
      setShowWinnerCard(true);
      if (soundEnabled) playWinFanfare();
      triggerConfetti();
    }, remainingMs);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(finishTimeout);
      if (tickTimer) clearTimeout(tickTimer);
    };
  }, [spinData, schedule_id, started_at, duration_ms, finalRotation, isSpinning, soundEnabled, triggerConfetti]);

  // Auto-close countdown when winner is revealed
  useEffect(() => {
    if (!showWinnerCard) return;
    const interval = setInterval(() => {
      setAutoCloseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showWinnerCard, onClose]);

  // SVG Wheel geometry calculations
  const size = 320;
  const center = size / 2;
  const radius = center - 16;

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x, y, r, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'L', x, y,
      'Z'
    ].join(' ');
  };

  if (!spinData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 w-full h-full" />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Live Badge & Sound Toggle */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="tracking-wide uppercase text-[10px]">🔴 Live Lucky Draw Spin</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            {!isSpinning && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Committee & Month Title */}
        <div className="relative z-10 space-y-0.5">
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <span>Month {month_no} Lucky Draw</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {committee_name ? `${committee_name} • ` : ''}
            {isSpinning 
              ? 'Koi boli na aane par computer dwara live random member chuna ja raha hai...'
              : 'Lucky Draw Sampanna! Winner Ghoshit Ho Gaya Hai 🎉'}
          </p>
        </div>

        {/* Center: The Lucky Draw Circular Wheel */}
        <div className="relative z-10 flex flex-col items-center justify-center py-2">
          {/* Wheel Container with Golden Pointer */}
          <div className="relative w-[320px] h-[320px] max-w-[85vw] max-h-[85vw]">
            
            {/* Top Golden Needle Pointer */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 drop-shadow-lg pointer-events-none">
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                <path
                  d="M17 40L4 10C2 5 6 0 12 0H22C28 0 32 5 30 10L17 40Z"
                  fill="url(#needleGrad)"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle cx="17" cy="12" r="4" fill="#ffffff" />
                <defs>
                  <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Glowing Outer Wheel Rim */}
            <div className="w-full h-full rounded-full p-2 bg-gradient-to-tr from-amber-500 via-orange-400 to-amber-600 shadow-2xl shadow-orange-500/30 border-4 border-amber-300/40">
              {/* Rotating Wheel Disk */}
              <div
                className="w-full h-full rounded-full overflow-hidden shadow-inner relative"
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                  transition: `transform ${transitionDurationSec}s cubic-bezier(0.12, 0.85, 0.22, 1)`
                }}
              >
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
                  {candidates.map((cand, idx) => {
                    const startAngle = idx * sliceAngle;
                    const endAngle = (idx + 1) * sliceAngle;
                    const midAngle = (startAngle + endAngle) / 2;
                    const color = SLICE_COLORS[idx % SLICE_COLORS.length];
                    const pathData = describeArc(center, center, radius, startAngle, endAngle);
                    const textPos = polarToCartesian(center, center, radius * 0.62, midAngle);
                    const shortName = (cand.name || 'Member').length > 10
                      ? `${cand.name.substring(0, 9)}..`
                      : cand.name;

                    return (
                      <g key={cand.id || idx}>
                        <path
                          d={pathData}
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          fill="#ffffff"
                          fontSize={candidates.length > 14 ? '9' : candidates.length > 8 ? '11' : '13'}
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                        >
                          {shortName}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Center Golden Pin Knob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border-2 border-white shadow-lg flex items-center justify-center pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-orange-600 border border-white flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Winner Announcement Card (Appears dynamically upon landing) */}
        {showWinnerCard ? (
          <div className="relative z-10 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-2.5 animate-bounce-short">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Draw Winner Announced</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-xs text-slate-300">Congratulations to Round Winner:</span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent">
                🏆 {winner_name || 'Member'}
              </h3>
            </div>

            <p className="text-[11px] text-emerald-300 font-medium">
              Month {month_no} ki committee inke naam par allot ho chuki hai!
            </p>

            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/30 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Great / Done ({autoCloseCountdown}s)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300/90 py-2">
            <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span>Spinning through {candidates.length} eligible members...</span>
          </div>
        )}
      </div>
    </div>
  );
}
