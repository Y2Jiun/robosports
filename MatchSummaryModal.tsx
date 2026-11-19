import React from 'react';
import { Trophy, Award, RotateCcw, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { MatchScore, RobotStats, OpponentBot } from '../types/game';

interface MatchSummaryModalProps {
  score: MatchScore;
  playerRobot: RobotStats;
  opponent: OpponentBot;
  is2Player: boolean;
  player2Name?: string;
  tokensEarned: number;
  onRematch: () => void;
  onNextStage?: () => void;
  onExit: () => void;
}

export const MatchSummaryModal: React.FC<MatchSummaryModalProps> = ({
  score,
  playerRobot,
  opponent,
  is2Player,
  player2Name = 'Team 2',
  tokensEarned,
  onRematch,
  onNextStage,
  onExit,
}) => {
  const isP1Winner = score.winner === 'team1';
  const isDraw = score.winner === 'draw';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col gap-5">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Judge Derrick's Official Verdict</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
            {isDraw
              ? 'TIE SCORE DRAW!'
              : isP1Winner
              ? `${playerRobot.name} WINS!`
              : `${is2Player ? player2Name : opponent.name} WINS!`}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {isP1Winner
              ? `Winner with FEWER marks (${score.team1Marks} marks vs ${score.team2Marks} marks) in the ${score.randomRoundDuration.toFixed(1)}s set!`
              : `Defeated by mark score (${score.team1Marks} marks vs ${score.team2Marks} marks). Remember: less marks the better!`}
          </p>
        </div>

        {/* Big Marks Comparison Card */}
        <div className="grid grid-cols-3 items-center gap-2 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
          <div className={`p-2 rounded-xl ${isP1Winner ? 'bg-rose-500/10 border border-rose-500/40' : ''}`}>
            <div className="text-xs font-bold text-rose-400 truncate">{playerRobot.name}</div>
            <div className="text-4xl font-black text-rose-500 font-mono-nums mt-1">
              {score.team1Marks > 0 ? `+${score.team1Marks}` : score.team1Marks}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {score.team1Orange} 🟠 (+{score.team1Orange}) · {score.team1Purple} 🟣 ({score.team1Purple * -2}) {score.team1VaultSecured && '· 🔒 -2 Vault'}
            </div>
          </div>

          <div className="text-slate-500 font-mono text-xs font-bold uppercase">
            <div className="text-amber-400">{score.randomRoundDuration.toFixed(1)}s SET</div>
            <div className="text-[10px] text-slate-400 mt-0.5">LESS IS BETTER</div>
          </div>

          <div className={`p-2 rounded-xl ${!isP1Winner && !isDraw ? 'bg-cyan-500/10 border border-cyan-500/40' : ''}`}>
            <div className="text-xs font-bold text-cyan-400 truncate">
              {is2Player ? player2Name : opponent.name}
            </div>
            <div className="text-4xl font-black text-cyan-400 font-mono-nums mt-1">
              {score.team2Marks > 0 ? `+${score.team2Marks}` : score.team2Marks}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {score.team2Orange} 🟠 (+{score.team2Orange}) · {score.team2Purple} 🟣 ({score.team2Purple * -2}) {score.team2VaultSecured && '· 🔒 -2 Vault'}
            </div>
          </div>
        </div>

        {/* Tactical Shots Fired */}
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Team 1 Shots Cleared</span>
            <div className="text-lg font-bold text-rose-400 font-mono-nums mt-0.5">
              {score.team1Shots} balls launched
            </div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Team 2 Shots Cleared</span>
            <div className="text-lg font-bold text-cyan-400 font-mono-nums mt-0.5">
              {score.team2Shots} balls launched
            </div>
          </div>
        </div>

        {/* Tokens reward */}
        {tokensEarned > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                WRO Double Tennis Bounty
              </span>
            </div>
            <span className="text-base font-black text-amber-400 font-mono-nums">
              +{tokensEarned} PTS
            </span>
          </div>
        )}

        {/* Derrick's signed remark */}
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-start gap-3">
          <img
            src="/images/derrick_referee_1790948521875.jpg"
            alt="Judge Derrick"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl object-cover ring-1 ring-amber-400/50 shrink-0"
          />
          <div className="text-xs text-slate-300 italic">
            "{isP1Winner
              ? `Masterful tactical driving! You held the purple balls (-2 marks) and launched the orange balls (+1 mark) over the ramp before time expired!`
              : `Opponent managed to dump their orange balls onto your side! Next time, pick up the orange balls quickly and shoot them right back!`}"
            <div className="text-[10px] font-mono text-amber-400 font-semibold not-italic mt-1">
              — Chief Judge Derrick
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onRematch}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Next Set</span>
          </button>

          {isP1Winner && onNextStage && (
            <button
              onClick={onNextStage}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-display text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>Next Opponent</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onExit}
            className="py-3 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Return to Paddock
          </button>
        </div>
      </div>
    </div>
  );
};
