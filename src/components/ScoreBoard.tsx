import React from 'react';
import { Volume2, VolumeX, Timer, Music, CircleDot, Sparkles } from 'lucide-react';
import { MatchScore, MatchStage } from '../types/game';

interface ScoreBoardProps {
  stage: MatchStage;
  title: string;
  subtitle: string;
  timeRemaining: number;
  matchScore: MatchScore;
  p1Name: string;
  p2Name: string;
  randomRoundDuration: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onForfeitMatch?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  stage,
  title,
  subtitle,
  timeRemaining,
  matchScore,
  p1Name,
  p2Name,
  randomRoundDuration,
  isMuted,
  onToggleMute,
  onForfeitMatch,
}) => {
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const ms = Math.floor((secs % 1) * 10);
    return `${s}.${ms}s`;
  };

  const isP1Leading = matchScore.team1Marks < matchScore.team2Marks;
  const isP2Leading = matchScore.team2Marks < matchScore.team1Marks;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Top Meta row */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              WRO DOUBLE TENNIS · MARKS SYSTEM
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-amber-300 font-black font-mono">
              THE LESS MARKS THE BIGGER VICTORY!
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 font-display mt-0.5">
            {title}
          </h2>
        </div>

        {/* Right tools: Music & Audio toggle and Exit */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-mono">
            <Music className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Intense Synth BGM</span>
          </div>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio & Music' : 'Mute Audio & Music'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {onForfeitMatch && (
            <button
              onClick={onForfeitMatch}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
            >
              Exit Match
            </button>
          )}
        </div>
      </div>

      {/* Main Scoreboard: Marks & Ball breakdown */}
      <div className="grid grid-cols-3 items-center gap-2 sm:gap-4 text-center">
        {/* TEAM 1 SIDE (LEFT) */}
        <div className={`rounded-xl p-3 border transition-all ${
          matchScore.isKO
            ? matchScore.koWinner === 'team1'
              ? 'bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-rose-950/70 border-rose-600 ring-2 ring-rose-600/50'
            : isP1Leading
            ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30'
            : 'bg-slate-950/70 border-rose-500/30'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1 flex-wrap">
            <span className="text-xs font-bold text-rose-400 truncate">
              {p1Name}
            </span>
            {matchScore.isKO ? (
              matchScore.koWinner === 'team1' ? (
                <span className="text-[9px] font-mono font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded shadow animate-bounce">
                  🏆 KO WINNER (-4 MARKS)
                </span>
              ) : (
                <span className="text-[9px] font-mono font-black bg-rose-600 text-white px-1.5 py-0.5 rounded shadow">
                  💀 KNOCKED OUT (9 MARKS)
                </span>
              )
            ) : isP1Leading ? (
              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1 rounded">
                LEADING (LESS)
              </span>
            ) : null}
          </div>

          <div className={`text-4xl sm:text-5xl font-black font-mono-nums ${
            matchScore.isKO && matchScore.koWinner === 'team1'
              ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]'
              : 'text-rose-500'
          }`}>
            {matchScore.team1Marks > 0 ? `+${matchScore.team1Marks}` : matchScore.team1Marks}
            <span className="text-xs text-slate-400 font-mono ml-1">marks</span>
          </div>

          <div className="text-[11px] text-slate-300 mt-1 font-mono-nums flex items-center justify-center gap-2">
            <span>🟠 {matchScore.team1Orange} (+{matchScore.team1Orange})</span>
            <span>·</span>
            <span className="text-purple-400 font-bold">🟣 {matchScore.team1Purple} ({matchScore.team1Purple * -2})</span>
            {matchScore.team1VaultSecured && (
              <span className="text-purple-300 font-bold bg-purple-950 px-1.5 py-0.5 rounded text-[10px] border border-purple-500/40">
                🔒 -{(matchScore.team1VaultSecuredCount || 1) * 2} VAULT
              </span>
            )}
          </div>
        </div>

        {/* CENTER MATCH CLOCK */}
        <div className={`flex flex-col items-center justify-center px-1 rounded-xl py-1 transition-all ${
          timeRemaining <= 10.0 && timeRemaining > 0 && stage === 'PLAYING'
            ? 'bg-red-950/40 border border-red-500/60 ring-2 ring-red-500/40 animate-pulse'
            : ''
        }`}>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
            <Timer className={`w-3.5 h-3.5 ${timeRemaining <= 10.0 && timeRemaining > 0 ? 'text-red-400 animate-spin' : 'text-amber-400'}`} />
            <span>
              {matchScore.isKO ? 'KNOCKOUT SET' : timeRemaining <= 10.0 && timeRemaining > 0 && stage === 'PLAYING' ? 'FINAL 10s COUNTDOWN' : 'SET CLOCK'}
            </span>
          </div>

          <div className={`text-2xl sm:text-3xl font-black font-mono-nums tracking-tight ${
            matchScore.isKO
              ? 'text-amber-400 drop-shadow'
              : timeRemaining <= 10.0 && timeRemaining > 0
              ? 'text-red-400 animate-bounce drop-shadow-[0_0_10px_rgba(248,113,113,0.8)]'
              : timeRemaining <= 4
              ? 'text-rose-400 animate-pulse'
              : 'text-slate-100'
          }`}>
            {matchScore.isKO ? '💥 KO!' : formatTime(timeRemaining)}
          </div>

          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {timeRemaining <= 10.0 && timeRemaining > 0 && stage === 'PLAYING' ? (
              <span className="text-red-400 font-black animate-pulse">🔊 SOUND TICKING ACTIVE</span>
            ) : (
              `Initial: ${randomRoundDuration.toFixed(1)}s (30s to 1 min)`
            )}
          </div>

          {/* Derrick's Ref Light */}
          <div className="flex items-center gap-1.5 mt-2 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${
              matchScore.isKO
                ? 'bg-amber-400 ring-2 ring-amber-400/50'
                : stage === 'PLAYING'
                ? 'bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse'
                : stage === 'ARE_YOU_READY'
                ? 'bg-amber-400 ring-2 ring-amber-400/30 animate-ping'
                : 'bg-rose-500'
            }`} />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              {matchScore.isKO ? 'KNOCKOUT (KO)' : stage === 'ARE_YOU_READY' ? 'READY CHECK' : stage === 'PLAYING' ? 'LIVE' : stage}
            </span>
          </div>
        </div>

        {/* TEAM 2 SIDE (RIGHT) */}
        <div className={`rounded-xl p-3 border transition-all ${
          matchScore.isKO
            ? matchScore.koWinner === 'team2'
              ? 'bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-cyan-950/70 border-cyan-600 ring-2 ring-cyan-600/50'
            : isP2Leading
            ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30'
            : 'bg-slate-950/70 border-cyan-500/30'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1 flex-wrap">
            <span className="text-xs font-bold text-cyan-400 truncate">
              {p2Name}
            </span>
            {matchScore.isKO ? (
              matchScore.koWinner === 'team2' ? (
                <span className="text-[9px] font-mono font-black bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded shadow animate-bounce">
                  🏆 KO WINNER (-4 MARKS)
                </span>
              ) : (
                <span className="text-[9px] font-mono font-black bg-cyan-600 text-white px-1.5 py-0.5 rounded shadow">
                  💀 KNOCKED OUT (9 MARKS)
                </span>
              )
            ) : isP2Leading ? (
              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1 rounded">
                LEADING (LESS)
              </span>
            ) : null}
          </div>

          <div className={`text-4xl sm:text-5xl font-black font-mono-nums ${
            matchScore.isKO && matchScore.koWinner === 'team2'
              ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]'
              : 'text-cyan-400'
          }`}>
            {matchScore.team2Marks > 0 ? `+${matchScore.team2Marks}` : matchScore.team2Marks}
            <span className="text-xs text-slate-400 font-mono ml-1">marks</span>
          </div>

          <div className="text-[11px] text-slate-300 mt-1 font-mono-nums flex items-center justify-center gap-2">
            <span>🟠 {matchScore.team2Orange} (+{matchScore.team2Orange})</span>
            <span>·</span>
            <span className="text-purple-400 font-bold">🟣 {matchScore.team2Purple} ({matchScore.team2Purple * -2})</span>
            {matchScore.team2VaultSecured && (
              <span className="text-purple-300 font-bold bg-purple-950 px-1.5 py-0.5 rounded text-[10px] border border-purple-500/40">
                🔒 -{(matchScore.team2VaultSecuredCount || 1) * 2} VAULT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span>🟠 Orange: <strong>+1 Mark</strong></span>
          <span>·</span>
          <span className="text-purple-400">🟣 Purple: <strong>-2 Marks</strong></span>
          <span>·</span>
          <span className="text-amber-300">🔑 Key + 🔒 Vault Box: <strong>Lock in -2 Marks</strong></span>
        </div>
        <div className="text-amber-400 font-mono text-[10px]">
          Less marks wins!
        </div>
      </div>
    </div>
  );
};
