import React, { useEffect } from 'react';
import { Sparkles, Trophy, CheckCircle2, Heart, Award, ArrowRight } from 'lucide-react';
import { ConfettiCanvas } from './ConfettiCanvas';
import { sound } from '../services/audioService';

interface MixuePrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cupsWon: number;
  playerName: string;
  onGoToCourt?: () => void;
}

export const MixuePrizeModal: React.FC<MixuePrizeModalProps> = ({
  isOpen,
  onClose,
  cupsWon,
  playerName,
  onGoToCourt,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playMixuePrize();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <ConfettiCanvas active={isOpen} />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-2 border-rose-500/80 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.4)] overflow-hidden text-center p-6 sm:p-8 flex flex-col items-center gap-5">
        
        {/* Glow ambient accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Derrick's announcement header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-mono text-xs font-black tracking-widest uppercase animate-bounce">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>JUDGE DERRICK SAYS:</span>
        </div>

        {/* The legendary Derrick quote */}
        <div className="flex flex-col items-center">
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white drop-shadow-[0_4px_12px_rgba(244,63,94,0.6)]">
            &ldquo;Ur prize!&rdquo; 🍦🎉
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-2 font-medium">
            You shouted <strong className="text-rose-400">MIXUE</strong> 10 times to Judge Derrick!
          </p>
        </div>

        {/* Image of the Mixue Ice Cream Cup */}
        <div className="relative group w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-4 border-rose-400 shadow-[0_10px_35px_rgba(244,63,94,0.5)] transform transition-transform hover:scale-105">
          <img
            src="/images/mixue_ice_cream_cup_1791634046839.jpg"
            alt="Mixue Ice Cream Cup Prize"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-center p-2">
            <span className="text-[11px] font-black font-mono text-amber-300 bg-slate-900/90 px-3 py-1 rounded-full border border-amber-400/50 flex items-center gap-1 shadow">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              AUTHENTIC MIXUE CUP
            </span>
          </div>
        </div>

        {/* Reward summary card */}
        <div className="w-full bg-slate-900/90 border border-rose-500/40 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400">Awarded To:</span>
            <span className="font-bold text-white font-mono">{playerName || 'Robo Champ'}</span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400">Mixue Cups Earned:</span>
            <span className="font-black text-rose-400 flex items-center gap-1">
              <Award className="w-4 h-4 text-rose-400" />
              {cupsWon} {cupsWon === 1 ? 'Cup' : 'Cups'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400">Prize Bonus:</span>
            <span className="font-black text-amber-400 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              +500 Tokens Awarded!
            </span>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 italic">
            &ldquo;Enjoy your cold Mixue ice cream while watching the robotics brawl!&rdquo; — Judge Derrick
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black font-display text-sm sm:text-base shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Claim & Keep Quizzing</span>
          </button>

          {onGoToCourt && (
            <button
              onClick={() => {
                onClose();
                onGoToCourt();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>Play Court Arena</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
