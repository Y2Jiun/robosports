import React, { useState } from 'react';
import { Volume2, Award, AlertTriangle, ShieldCheck, Flag, CheckCircle, Clock } from 'lucide-react';
import { JudgeMood } from '../types/game';
import { sound } from '../services/audioService';

interface JudgeDerrickProps {
  mood: JudgeMood;
  commentary?: string;
  isFalseStart?: boolean;
  onWhistleClick?: () => void;
  compact?: boolean;
  team1Ready?: boolean;
  team2Ready?: boolean;
  onConfirmTeam1Ready?: () => void;
  onConfirmTeam2Ready?: () => void;
  isAskingReady?: boolean;
  randomRoundDuration?: number;
}

export const JudgeDerrick: React.FC<JudgeDerrickProps> = ({
  mood,
  commentary,
  isFalseStart = false,
  onWhistleClick,
  compact = false,
  team1Ready = false,
  team2Ready = false,
  onConfirmTeam1Ready,
  onConfirmTeam2Ready,
  isAskingReady = false,
  randomRoundDuration,
}) => {
  const [isBlowing, setIsBlowing] = useState(false);

  const handleWhistle = () => {
    setIsBlowing(true);
    sound.playWhistle(true);
    if (onWhistleClick) onWhistleClick();
    setTimeout(() => setIsBlowing(false), 700);
  };

  const getDerrickStatus = () => {
    if (isFalseStart) return 'FOUL: FALSE START';
    switch (mood) {
      case 'ASKING_READY':
        return 'PRE-MATCH READINESS CHECK';
      case 'COUNTDOWN':
        return 'COUNTDOWN: 3... 2... 1... GO!';
      case 'WHISTLE':
        return 'MATCH LIVE: DOUBLE TENNIS';
      case 'CHEERING':
        return 'HIGH INTENSITY RALLY!';
      case 'BALL_CLEARED':
        return 'BALL SMASHED OVER RAMP';
      case 'VICTORY':
        return 'SET CERTIFIED BY DERRICK';
      case 'PENALTY':
        return 'RULEBOOK ENFORCED';
      default:
        return 'CHIEF OFFICIAL ON DECK';
    }
  };

  const defaultCommentary = {
    READY: "Welcome to the WRO RoboSports Double Tennis Court! 2 robots per side. Clear the orange balls over the ramp before time expires!",
    ASKING_READY: "Team 1, are you ready? Team 2, are you ready? Signal your readiness before I blow the countdown whistle!",
    COUNTDOWN: "Both teams confirmed ready! Keep fingers steady... 3, 2, 1, GO!",
    WHISTLE: "TWEET! GO! Smash and clear those orange balls over the ramp!",
    CHEERING: "Incredible racket speed! The robots are launching balls back and forth over the barrier!",
    BALL_CLEARED: "Clean ramp clearance! That ball is on the opponent's court!",
    PENALTY: "HOLD IT! False start detected! Derrick yellow card penalty applied!",
    VICTORY: "Buzzer sounded! Balls counted. Official WRO victory certified!",
  }[mood] || commentary;

  const currentCommentary = commentary || defaultCommentary;

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative shrink-0">
            <img
              src="/images/derrick_referee_1790948521875.jpg"
              alt="Judge Derrick - Chief Referee"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-400 shadow-md"
            />
            {isBlowing && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 tracking-wide font-display">
                JUDGE DERRICK
              </span>
              <span className="text-[10px] text-slate-400">·</span>
              <span className="text-[10px] text-slate-400 uppercase truncate">
                {getDerrickStatus()}
              </span>
              {randomRoundDuration && (
                <>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Set: {randomRoundDuration.toFixed(1)}s
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-200 truncate mt-0.5 font-medium">
              "{currentCommentary}"
            </p>
          </div>
        </div>

        {/* Readiness Controls in compact header if asking ready */}
        {isAskingReady && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onConfirmTeam1Ready}
              disabled={team1Ready}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                team1Ready
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow cursor-pointer'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{team1Ready ? 'Team 1: READY' : 'Team 1: Confirm Ready'}</span>
            </button>

            <button
              onClick={onConfirmTeam2Ready}
              disabled={team2Ready}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                team2Ready
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow cursor-pointer'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{team2Ready ? 'Team 2: READY' : 'Team 2: Confirm Ready'}</span>
            </button>
          </div>
        )}

        <button
          onClick={handleWhistle}
          title="Ask Derrick to blow whistle"
          className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Whistle</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 relative z-10">
        {/* Derrick's Portrait (Faithful to user photo) */}
        <div className="relative group shrink-0">
          <div className={`relative rounded-2xl p-1 bg-gradient-to-b ${isFalseStart ? 'from-rose-500 to-amber-500' : 'from-amber-400 via-amber-500 to-amber-600'} shadow-lg transition-transform ${isBlowing ? 'scale-105' : ''}`}>
            <img
              src="/images/derrick_referee_1790948521875.jpg"
              alt="Chief Official Judge Derrick"
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover ring-2 ring-slate-950 bg-slate-900 shadow-md"
            />
            {isBlowing && (
              <div className="absolute inset-0 rounded-2xl ring-4 ring-amber-400/60 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Official badge overlay */}
          <div className="absolute -bottom-2 -right-2 bg-slate-950 border border-amber-400/70 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>JUDGE DERRICK</span>
          </div>
        </div>

        {/* Derrick's Speech & Official Rulings */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <span className="text-base sm:text-lg font-bold text-slate-100 font-display flex items-center gap-2">
              Judge Derrick
              <span className="text-xs font-mono font-normal text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
                WRO RoboSports Head Official
              </span>
            </span>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
              isFalseStart
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : isAskingReady
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {isFalseStart ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>FALSE START PENALTY</span>
                </>
              ) : isAskingReady ? (
                <>
                  <Flag className="w-3 h-3 text-amber-400" />
                  <span>"ARE YOU READY TO BOTH TEAMS?"</span>
                </>
              ) : mood === 'VICTORY' ? (
                <>
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>SET WINNER CERTIFIED</span>
                </>
              ) : (
                <>
                  <Flag className="w-3 h-3 text-slate-400" />
                  <span>{getDerrickStatus()}</span>
                </>
              )}
            </span>

            {randomRoundDuration && (
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Random Set Duration: {randomRoundDuration.toFixed(1)}s (30s to 1 min rule)
              </span>
            )}
          </div>

          {/* Derrick's Official Dialogue Bubble */}
          <div className="relative mt-2 p-3 sm:p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-sm leading-relaxed shadow-inner">
            <div className="absolute -left-1.5 top-4 w-3 h-3 bg-slate-950 border-l border-t border-slate-800 transform -rotate-45 hidden sm:block" />
            <p className="font-medium text-slate-200 italic">
              "{currentCommentary}"
            </p>
          </div>

          {/* ARE YOU READY INTERACTIVE BUTTONS */}
          {isAskingReady && (
            <div className="mt-3.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Judge Derrick Asks: "Are you ready to both teams?"</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  onClick={onConfirmTeam1Ready}
                  disabled={team1Ready}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    team1Ready
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow active:scale-95'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{team1Ready ? 'Team 1 (Left): READY ✓' : 'Team 1: Click Ready!'}</span>
                </button>

                <button
                  onClick={onConfirmTeam2Ready}
                  disabled={team2Ready}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                    team2Ready
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow active:scale-95'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{team2Ready ? 'Team 2 (Right): READY ✓' : 'Team 2: Click Ready!'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
            <button
              onClick={handleWhistle}
              disabled={isBlowing}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-2 cursor-pointer ${
                isBlowing
                  ? 'bg-amber-400 text-slate-950 border-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-amber-500/30 hover:border-amber-400/60'
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${isBlowing ? 'animate-bounce' : ''}`} />
              <span>{isBlowing ? 'TWEET! (Whistle Blown)' : 'Blow Official Whistle'}</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              WRO Double Tennis Rules: Clear all balls before timer buzzer!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
