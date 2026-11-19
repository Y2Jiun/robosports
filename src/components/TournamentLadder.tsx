import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Lock,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  ShieldCheck,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { PlayerProfile, OpponentBot } from '../types/game';
import { TOURNAMENT_STAGES, tournamentService } from '../services/tournamentService';
import { GlobalRobotArenaLeaderboard } from './GlobalRobotArenaLeaderboard';

interface TournamentLadderProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onStartMatch: (opponent: OpponentBot) => void;
  onOpenCelebration: () => void;
  onRestartTournament: () => void;
}

export const TournamentLadder: React.FC<TournamentLadderProps> = ({
  profile,
  onUpdateProfile,
  onStartMatch,
  onOpenCelebration,
  onRestartTournament,
}) => {
  const progress = profile.tournamentProgress || {
    currentStage: 1,
    stage1Wins: 0,
    stage2Wins: 0,
    stage3Wins: 0,
    isChampion: false,
    totalTournamentWins: 0,
  };

  const [confirmRestart, setConfirmRestart] = useState(false);
  const currentOpponent = tournamentService.getCurrentOpponent(progress);
  const currentStage = progress.currentStage;
  const isChampion = progress.isChampion;

  const getWins = (stageNum: 1 | 2 | 3) => {
    if (stageNum === 1) return progress.stage1Wins || 0;
    if (stageNum === 2) return progress.stage2Wins || 0;
    return progress.stage3Wins || 0;
  };

  const getRequired = (stageNum: 1 | 2 | 3) => {
    return tournamentService.getRequiredWinsForStage(stageNum);
  };

  const isStageUnlocked = (stageNum: 1 | 2 | 3) => {
    if (stageNum === 1) return true;
    if (stageNum === 2) return (progress.stage1Wins || 0) >= 5;
    return (progress.stage2Wins || 0) >= 5;
  };

  const isStageCompleted = (stageNum: 1 | 2 | 3) => {
    if (stageNum === 1) return (progress.stage1Wins || 0) >= 5;
    if (stageNum === 2) return (progress.stage2Wins || 0) >= 5;
    return (progress.stage3Wins || 0) >= 1;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* CHAMPION BANNER (when all 3 stages completed) */}
      {isChampion && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-600/20 border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shrink-0 ring-4 ring-amber-400/40">
              <Trophy className="w-9 h-9 sm:w-12 sm:h-12 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>WRO WORLD TOURNAMENT CHAMPION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white mt-0.5">
                All 3 Stages Completed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                You cleared Stage 1 (5 wins), Stage 2 (5 wins against stronger bots), and defeated <strong className="text-amber-400">Team Taiwan</strong> in the Grand Finals!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenCelebration}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>VIEW VICTORY CELEBRATION</span>
            </button>

            <button
              onClick={() => setConfirmRestart(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RESTART TOURNAMENT</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER / STATS OVERVIEW */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              OFFICIAL WRO TOURNAMENT BRACKET
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mt-1">
            Double Tennis Championship Ladder
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Win <strong>5 matches</strong> in Stage 1 & Stage 2 to advance. In Grand Finals, defeat <strong>Team Taiwan</strong> in 1 match to claim the trophy!
          </p>
        </div>

        {/* Tokens & Overall Wins Stats */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                Tokens
              </div>
              <div className="text-lg font-black text-amber-400 font-mono-nums leading-tight">
                {profile.tokens} PTS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                Ladder Wins
              </div>
              <div className="text-lg font-black text-cyan-400 font-mono-nums leading-tight">
                {(progress.stage1Wins || 0) + (progress.stage2Wins || 0) + (progress.stage3Wins || 0)} / 11
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM RESTART MODAL DIALOG */}
      {confirmRestart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-lg">
              <RotateCcw className="w-5 h-5" />
              <span>Restart Tournament Ladder?</span>
            </div>
            <p className="text-sm text-slate-300">
              This will reset your ladder progression back to <strong>Stage 1 (0 / 5 Wins)</strong> so you can replay the tournament from the start. Your tokens and robot upgrades will stay safe!
            </p>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setConfirmRestart(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmRestart(false);
                  onRestartTournament();
                }}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black font-display transition-all cursor-pointer"
              >
                Yes, Reset to Stage 1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEXT MATCH HERO CARD (if not yet completed or if replaying) */}
      {!isChampion && (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400/80 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400 shrink-0 shadow-lg">
              <img
                src={currentOpponent.image}
                alt={currentOpponent.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 bg-amber-400 text-slate-950 text-[10px] font-mono font-black px-1.5 py-0.5 rounded">
                STAGE 0{currentStage}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                <Swords className="w-3.5 h-3.5" />
                <span>
                  {currentStage === 3
                    ? 'GRAND FINALS CHAMPIONSHIP MATCH'
                    : `STAGE ${currentStage} · MATCH ${getWins(currentStage) + 1} OF ${getRequired(currentStage)}`}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white mt-0.5 truncate">
                Next Opponent: {currentOpponent.name}
              </h3>
              <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span>Team: <strong className="text-slate-200">{currentOpponent.team}</strong></span>
                <span>·</span>
                <span>Country: <strong className="text-cyan-300">{currentOpponent.country}</strong></span>
                <span>·</span>
                <span>Speed: <strong className="text-amber-400">{currentOpponent.speed}x</strong></span>
                <span>·</span>
                <span>Accuracy: <strong className="text-amber-400">{Math.round(currentOpponent.shootAccuracy * 100)}%</strong></span>
              </div>
              <p className="text-xs text-slate-300 italic mt-2 line-clamp-2">
                "{currentOpponent.quote}"
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={() => onStartMatch(currentOpponent)}
              className="py-3.5 px-6 sm:px-8 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-sm sm:text-base rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>
                {currentStage === 3
                  ? 'FIGHT TEAM TAIWAN IN GRAND FINALS'
                  : `START STAGE ${currentStage} MATCH (${getWins(currentStage) + 1}/5)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 3 STAGES BRACKET GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TOURNAMENT_STAGES.map((stageConfig) => {
          const stageNum = stageConfig.stageNumber;
          const wins = getWins(stageNum);
          const req = stageConfig.requiredWins;
          const isUnlocked = isStageUnlocked(stageNum);
          const isCompleted = isStageCompleted(stageNum);
          const isCurrent = currentStage === stageNum && !isChampion;

          return (
            <div
              key={stageConfig.id}
              className={`relative rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between overflow-hidden ${
                !isUnlocked
                  ? 'bg-slate-950/50 border-slate-900 opacity-60'
                  : isCurrent
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-amber-400 shadow-xl ring-2 ring-amber-400/30'
                  : isCompleted
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isCompleted
                    ? 'bg-emerald-400'
                    : isCurrent
                    ? 'bg-amber-400'
                    : isUnlocked
                    ? 'bg-slate-700'
                    : 'bg-slate-800'
                }`}
              />

              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Stage 0{stageNum}
                  </span>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      STAGE CLEARED
                    </span>
                  ) : !isUnlocked ? (
                    <span className="flex items-center gap-1 text-slate-500 font-semibold text-xs">
                      <Lock className="w-3.5 h-3.5" />
                      LOCKED
                    </span>
                  ) : isCurrent ? (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs animate-pulse">
                      <Flame className="w-3.5 h-3.5" />
                      CURRENT STAGE
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">UNLOCKED</span>
                  )}
                </div>

                <h3 className="text-xl font-bold font-display text-white">
                  {stageConfig.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {stageConfig.subtitle}
                </p>

                {/* Wins Requirement Banner */}
                <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      Required Wins
                    </div>
                    <div className="text-sm font-bold text-white">
                      {stageNum === 3 ? '1 Win vs Team Taiwan' : '5 Wins Against Bots'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                      Progress
                    </div>
                    <div className="text-base font-black font-mono-nums text-amber-400">
                      {wins} / {req}
                    </div>
                  </div>
                </div>

                {/* Progress Visual Indicators (Dots / Marks) */}
                <div className="mt-3 flex items-center justify-center gap-2 py-2">
                  {Array.from({ length: req }).map((_, i) => {
                    const isWinDone = i < wins;
                    const isNextTarget = i === wins && isCurrent;

                    return (
                      <div
                        key={i}
                        className={`flex-1 h-3 rounded-full transition-all flex items-center justify-center ${
                          isWinDone
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                            : isNextTarget
                            ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/40'
                            : 'bg-slate-800'
                        }`}
                        title={`Match ${i + 1}: ${isWinDone ? 'Won' : isNextTarget ? 'Next Match' : 'Upcoming'}`}
                      />
                    );
                  })}
                </div>

                {/* Bots Preview List */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                    {stageNum === 3 ? 'Grand Finals Opponent:' : 'Stage Opponents (Escalating Difficulty):'}
                  </div>

                  {stageConfig.bots.map((bot, bIdx) => {
                    const isDefeated = bIdx < wins;
                    const isTarget = bIdx === wins && isCurrent;

                    return (
                      <div
                        key={bot.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                          isDefeated
                            ? 'bg-slate-950/50 border-emerald-500/30 text-slate-400'
                            : isTarget
                            ? 'bg-slate-950 border-amber-400/80 ring-1 ring-amber-400/40 text-white'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                          <img
                            src={bot.image}
                            alt={bot.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="truncate">{bot.name}</span>
                            {isDefeated ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                            ) : isTarget ? (
                              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase shrink-0 ml-1">
                                ACTIVE
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {bot.team} · {bot.country}
                          </div>
                          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                            Speed: {bot.speed}x · Acc: {Math.round(bot.shootAccuracy * 100)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  {stageNum === 3 ? 'Championship Match' : `+${stageConfig.tokenRewardPerWin} PTS / Win`}
                </span>
                <span className="font-bold text-amber-400">
                  +{stageConfig.stageClearReward} PTS Clear Bonus
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Robot Arena Leaderboard Section */}
      <GlobalRobotArenaLeaderboard currentProfile={profile} />

      {/* Manual Restart Option at bottom */}
      <div className="mt-2 flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400">
        <div>
          <span>Want to reset tournament progress and start fresh from Stage 1?</span>
        </div>
        <button
          onClick={() => setConfirmRestart(true)}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Restart Tournament</span>
        </button>
      </div>
    </div>
  );
};
