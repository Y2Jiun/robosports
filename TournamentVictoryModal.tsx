import React, { useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Award, CheckCircle2, Star, Sparkles, Shield, X } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { sound } from '../services/audioService';

interface TournamentVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartTournament: () => void;
  profile: PlayerProfile;
}

export const TournamentVictoryModal: React.FC<TournamentVictoryModalProps> = ({
  isOpen,
  onClose,
  onRestartTournament,
  profile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    sound.playGrandVictoryFanfare();

    // Canvas Confetti & Sparkles
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#8b5cf6', '#ffffff', '#fbbf24'];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
    }));

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* Background Falling Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      />

      <div className="relative z-20 w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 overflow-hidden my-auto">
        {/* Glowing aura */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button in corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close celebration"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Golden Trophy */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl ring-4 ring-amber-400/40 animate-bounce">
              <Trophy className="w-14 h-14 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow-lg">
              CHAMPION
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>WRO WORLD ROBOSPORTS TOURNAMENT</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display text-white mt-1 tracking-tight">
            GRAND FINALS CHAMPION!
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mt-2">
            Congratulations <span className="font-bold text-amber-400">{profile.name}</span>! You have triumphed over all 3 tournament stages and decisively defeated <span className="font-bold text-cyan-300">Team Taiwan</span> in the Grand Finals!
          </p>
        </div>

        {/* Stage Completion Verification Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stage 1 */}
          <div className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">Stage 01 Cleared</span>
            <span className="text-xs font-bold text-white mt-0.5">Regional Qualifiers</span>
            <span className="text-[11px] text-slate-400 mt-1 font-mono">5 / 5 Bot Wins</span>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">Stage 02 Cleared</span>
            <span className="text-xs font-bold text-white mt-0.5">National Championship</span>
            <span className="text-[11px] text-slate-400 mt-1 font-mono">5 / 5 Strong Bot Wins</span>
          </div>

          {/* Stage 3 Grand Finals */}
          <div className="bg-slate-950/70 border border-amber-400/60 rounded-xl p-3.5 flex flex-col items-center text-center ring-1 ring-amber-400/30">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center mb-2">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">Grand Finals Win</span>
            <span className="text-xs font-bold text-white mt-0.5">Team Taiwan Defeated</span>
            <span className="text-[11px] text-amber-300 mt-1 font-mono">1 / 1 Decisive Win 🇹🇼</span>
          </div>
        </div>

        {/* Official Referee Adjudication Certificate */}
        <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 flex items-start gap-4">
          <img
            src="/images/derrick_referee_1790948521875.jpg"
            alt="Judge Derrick"
            className="w-14 h-14 rounded-xl object-cover ring-2 ring-amber-400 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>OFFICIAL TOURNAMENT RULING · JUDGE DERRICK</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 italic mt-1.5">
              "As Head Official Derrick, I certify this flawless tournament run. You cleared all 11 matches across 3 stages, withstanding the escalating bot speeds and conquering Team Taiwan on the center court. Outstanding robot engineering and tennis ramp execution!"
            </p>
            <div className="mt-2.5 flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>Status: <strong className="text-emerald-400">OFFICIAL CHAMPION</strong></span>
              <span>·</span>
              <span>Reward: <strong className="text-amber-400">+1,500 TOURNAMENT TOKENS</strong></span>
            </div>
          </div>
        </div>

        {/* Interactive Restart Section */}
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-base">
            <RotateCcw className="w-4 h-4" />
            <span>Ready for another tournament run?</span>
          </div>
          <p className="text-xs text-slate-300 max-w-md">
            You completed all 3 stages! Do you want to restart the tournament ladder back to Stage 1 to challenge the bots again?
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-1">
            <button
              onClick={onRestartTournament}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>YES, RESTART TOURNAMENT</span>
            </button>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>KEEP CHAMPION TITLE & EXPLORE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
