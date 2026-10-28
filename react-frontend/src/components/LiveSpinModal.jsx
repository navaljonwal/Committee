import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Trophy, X, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';

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
  const fullRounds = 8 * 360; // 8 full spins for suspense
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

  // SVG Wheel geometry calculations (360x360 coordinate space)
  const size = 360;
  const center = size / 2; // 180
  const rimRadius = 176;
  const wheelRadius = 152;

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x, y, r, startAngle, endAngle) => {
    const safeEnd = Math.min(359.99, endAngle);
    const start = polarToCartesian(x, y, r, safeEnd);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = safeEnd - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
      'L', x, y,
      'Z'
    ].join(' ');
  };

  if (!spinData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 xs:p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      {/* Confetti Canvas */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 w-full h-full" />

      {/* Main Responsive App Card */}
      <div className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-md md:max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/35 rounded-3xl p-3 xs:p-4 sm:p-6 shadow-2xl text-center space-y-3 sm:space-y-4 overflow-hidden my-auto">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-0 w-48 h-48 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Live Badge & Sound Toggle */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] xs:text-xs font-bold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="tracking-wider uppercase font-black">Live Lucky Draw</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 xs:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition active:scale-95"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            {!isSpinning && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 xs:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Committee & Month Title */}
        <div className="relative z-10 space-y-0.5">
          <h2 className="text-base xs:text-lg sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 xs:gap-2">
            <Sparkles className="w-4 h-4 xs:w-5 xs:h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Month {month_no} Lucky Draw</span>
          </h2>
          <p className="text-[11px] xs:text-xs text-slate-400 font-medium px-2">
            {committee_name ? `${committee_name} • ` : ''}
            {isSpinning 
              ? 'Koi boli na aane par computer dwara live random draw chalaya ja raha hai'
              : 'Lucky Draw Sampanna! Winner Ghoshit Ho Gaya Hai 🎉'}
          </p>
        </div>

        {/* Center: The Lucky Draw Circular Wheel (Native Mobile App Styled) */}
        <div className="relative z-10 flex flex-col items-center justify-center py-1 xs:py-2">
          {/* Wheel Frame Container — Fluid Responsive on Both Phone and Desktop */}
          <div className="relative w-[230px] h-[230px] xs:w-[260px] xs:h-[260px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] max-w-[76vw] max-h-[76vw] aspect-square mx-auto flex items-center justify-center">
            
            {/* Top 3D Metallic Golden Needle Pointer */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 drop-shadow-2xl pointer-events-none">
              <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
                <path
                  d="M18 42L5 12C2 6 7 0 14 0H22C29 0 34 6 31 12L18 42Z"
                  fill="url(#goldNeedleGrad)"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle cx="18" cy="14" r="5" fill="#ffffff" />
                <circle cx="18" cy="14" r="3" fill="#ea580c" />
                <defs>
                  <linearGradient id="goldNeedleGrad" x1="0" y1="0" x2="0" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fef08a" />
                    <stop offset="0.3" stopColor="#f59e0b" />
                    <stop offset="1" stopColor="#b45309" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Outer Golden Bezel with Glowing Casino LED Lights */}
            <div className="w-full h-full rounded-full p-2 xs:p-2.5 sm:p-3 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 shadow-2xl shadow-orange-500/35 border-2 xs:border-3 border-amber-300/60 relative flex items-center justify-center">
              
              {/* Rotating Wheel Disk Container */}
              <div
                className="w-full h-full rounded-full overflow-hidden shadow-inner relative flex items-center justify-center"
                style={{
                  transform: `rotate(${rotationDeg}deg)`,
                  transition: `transform ${transitionDurationSec}s cubic-bezier(0.12, 0.85, 0.22, 1)`
                }}
              >
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
                  <defs>
                    <radialGradient id="sliceShadow" cx="50%" cy="50%" r="50%">
                      <stop offset="70%" stopColor="#000000" stopOpacity="0" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
                    </radialGradient>
                  </defs>

                  {candidates.length === 1 ? (
                    <g>
                      <circle cx={center} cy={center} r={wheelRadius} fill={SLICE_COLORS[0]} stroke="#ffffff" strokeWidth="2" />
                      <text
                        x={center}
                        y={center}
                        fill="#ffffff"
                        fontSize="18"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                      >
                        {candidates[0]?.name || 'Member'}
                      </text>
                    </g>
                  ) : (
                    candidates.map((cand, idx) => {
                      const startAngle = idx * sliceAngle;
                      const endAngle = (idx + 1) * sliceAngle;
                      const midAngle = (startAngle + endAngle) / 2;
                      const color = SLICE_COLORS[idx % SLICE_COLORS.length];
                      const pathData = describeArc(center, center, wheelRadius, startAngle, endAngle);
                      const textPos = polarToCartesian(center, center, wheelRadius * 0.63, midAngle);
                      const rawName = (cand.name || 'Member').trim();
                      const shortName = rawName.length > 10 ? `${rawName.substring(0, 9)}..` : rawName;
                      const fontSize = candidates.length > 16 ? 9 : candidates.length > 10 ? 10.5 : candidates.length > 6 ? 12 : 13.5;

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
                            fontSize={fontSize}
                            fontWeight="900"
                            letterSpacing="0.02em"
                            textAnchor="middle"
                            dominantBaseline="central"
                            transform={`rotate(${midAngle}, ${textPos.x}, ${textPos.y})`}
                            style={{
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                          >
                            {shortName}
                          </text>
                        </g>
                      );
                    })
                  )}

                  {/* Inner Rim Gradient Overlay for Depth */}
                  <circle cx={center} cy={center} r={wheelRadius} fill="url(#sliceShadow)" pointerEvents="none" />
                </svg>
              </div>

              {/* Fixed Center Metallic Medallion / Knob (Stays stationary while disk rotates) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 xs:w-13 xs:h-13 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-200 to-amber-500 border-2 sm:border-3 border-white shadow-2xl flex items-center justify-center pointer-events-none z-20">
                <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-orange-500 to-red-600 border border-amber-200 shadow-inner flex items-center justify-center">
                  <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-white animate-spin" style={{ animationDuration: '5s' }} />
                </div>
              </div>

              {/* Glowing Rim Casino LED Bulbs */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
                {Array.from({ length: 16 }).map((_, i) => {
                  const dotAngle = i * (360 / 16);
                  const dotPos = polarToCartesian(center, center, 166, dotAngle);
                  const isLit = i % 2 === 0;
                  return (
                    <circle
                      key={i}
                      cx={dotPos.x}
                      cy={dotPos.y}
                      r="3.2"
                      fill={isLit ? '#ffffff' : '#fbbf24'}
                      stroke="#78350f"
                      strokeWidth="0.8"
                      className={isSpinning ? (isLit ? 'animate-pulse' : '') : ''}
                      filter="drop-shadow(0 0 3px rgba(253, 224, 71, 0.95))"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Winner Announcement Card (Appears dynamically upon landing) */}
        {showWinnerCard ? (
          <div className="relative z-10 bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 border-2 border-amber-400/80 rounded-2xl p-3.5 xs:p-4 sm:p-5 shadow-xl space-y-2 animate-bounce-short">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 font-extrabold text-[11px] xs:text-xs uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Round Winner Announced</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] xs:text-xs text-slate-300">Congratulations to Round Winner:</span>
              <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white tracking-tight bg-gradient-to-r from-amber-200 via-white to-amber-200 bg-clip-text text-transparent">
                🏆 {winner_name || 'Member'}
              </h3>
            </div>

            <p className="text-[11px] text-emerald-300 font-medium">
              Month {month_no} ki committee inke naam par allot ho chuki hai!
            </p>

            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-black transition shadow-lg shadow-orange-500/30 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Great / Done ({autoCloseCountdown}s)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex items-center justify-center gap-2 text-[11px] xs:text-xs font-bold text-amber-300/90 py-1.5">
            <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span>Spinning through {candidates.length} eligible members...</span>
          </div>
        )}
      </div>
    </div>
  );
}
