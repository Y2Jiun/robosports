import React, { useEffect, useRef } from 'react';
import { Crosshair, Lock, Unlock, Key, Box, Sparkles, Bot, Users, RotateCcw, Zap, Globe2, Wifi, Trophy } from 'lucide-react';
import { RobotStats, OpponentBot, MatchStage, MatchScore, TennisBall, CourtRobot, VaultBox, KeyItem } from '../types/game';
import { VirtualJoystick } from './VirtualJoystick';

interface RoboArenaProps {
  stage: MatchStage;
  is2Player: boolean;
  playerRobot: RobotStats;
  opponent: OpponentBot;
  player2Name?: string;
  matchScore: MatchScore;
  balls: TennisBall[];
  robot1: CourtRobot;
  robot2: CourtRobot;
  team1Vault: VaultBox;
  team2Vault: VaultBox;
  team1Key: KeyItem;
  team2Key: KeyItem;
  onMoveP1: (dx: number, dy: number) => void;
  onMoveP2: (dx: number, dy: number) => void;
  onShootP1: () => void;
  onShootP2: () => void;
  countdownNumber: number | null;
  team1Ready: boolean;
  team2Ready: boolean;
  onConfirmTeam1Ready: () => void;
  onConfirmTeam2Ready: () => void;
  randomRoundDuration: number;
  onRestartMatch?: () => void;
  onSelectRoundDuration?: (secs: number) => void;
  onSkipCountdown?: () => void;
  botSpeedMultiplier?: number;
  onSelectBotSpeed?: (speed: number) => void;
  stationNumber?: number; // 1, 2, or 3 for multi-screen!
  controlKeysLabel?: { p1Drive: string; p1Shoot: string };
  isOnline?: boolean;
  isOnlineHost?: boolean;
  onOpenOnlineInvite?: () => void;
  onlinePing?: number | null;
  remotePlayerName?: string;
  onSendEmote?: (text: string) => void;
  floatingEmotes?: Array<{ id: number; text: string; sender: 'p1' | 'p2'; x: number; y: number }>;
  p1ChargeTime?: number;
  p2ChargeTime?: number;
  botChargeTime?: number;
  onStartChargeP1: () => void;
  onCancelChargeP1: () => void;
  onStartChargeP2: () => void;
  onCancelChargeP2: () => void;
  koState?: { active: boolean; dangerSide: 'team1' | 'team2'; secondsLeft: number } | null;
  timeRemaining: number;
  tournamentInfo?: {
    stage: 1 | 2 | 3;
    matchNumber: number;
    requiredWins: number;
    isGrandFinals: boolean;
    isChampion: boolean;
    stageCleared?: boolean;
    isP1Win?: boolean;
  };
  onViewTournamentLadder?: () => void;
}

export const RoboArena: React.FC<RoboArenaProps> = ({
  stage,
  is2Player,
  playerRobot,
  opponent,
  player2Name = 'Team 2',
  matchScore,
  balls,
  robot1,
  robot2,
  team1Vault,
  team2Vault,
  team1Key,
  team2Key,
  onMoveP1,
  onMoveP2,
  onShootP1,
  onShootP2,
  countdownNumber,
  team1Ready,
  team2Ready,
  onConfirmTeam1Ready,
  onConfirmTeam2Ready,
  randomRoundDuration,
  onRestartMatch,
  onSelectRoundDuration,
  onSkipCountdown,
  botSpeedMultiplier = 2,
  onSelectBotSpeed,
  stationNumber = 1,
  controlKeysLabel,
  isOnline = false,
  isOnlineHost = true,
  onOpenOnlineInvite,
  onlinePing = null,
  remotePlayerName,
  onSendEmote,
  floatingEmotes = [],
  p1ChargeTime = 0,
  p2ChargeTime = 0,
  botChargeTime = 0,
  onStartChargeP1,
  onCancelChargeP1,
  onStartChargeP2,
  onCancelChargeP2,
  koState = null,
  timeRemaining = 45,
  tournamentInfo,
  onViewTournamentLadder,
}) => {
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Keyboard controls listener: You must press & hold Space for 1 second to shoot!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (stage === 'ARE_YOU_READY') {
        if (['KeyA', 'Space', 'Enter'].includes(e.code) && !team1Ready) {
          e.preventDefault();
          onConfirmTeam1Ready();
        }
        return;
      }

      keysPressed.current[e.code] = true;

      // Online Guest: charges only Team 2 (1-second hold to shoot)
      if (isOnline && !isOnlineHost) {
        if (['Space', 'Enter', 'ShiftRight', 'ShiftLeft', 'KeyF'].includes(e.code) && stage === 'PLAYING') {
          e.preventDefault();
          if (!e.repeat) {
            onStartChargeP2();
          }
        }
        return;
      }

      // Host or Local Solo player: charges Team 1 (1-second hold to shoot)
      if (['Space', 'Enter', 'ShiftRight', 'ShiftLeft', 'KeyF'].includes(e.code) && stage === 'PLAYING') {
        e.preventDefault();
        if (!e.repeat) {
          onStartChargeP1();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;

      // Releasing space before 1.0s cancels the charge
      if (['Space', 'Enter', 'ShiftRight', 'ShiftLeft', 'KeyF'].includes(e.code)) {
        if (isOnline && !isOnlineHost) {
          onCancelChargeP2();
        } else {
          onCancelChargeP1();
        }
      }
    };

    const handleBlur = () => {
      keysPressed.current = {};
      onCancelChargeP1();
      onCancelChargeP2();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [stage, team1Ready, onConfirmTeam1Ready, onStartChargeP1, onCancelChargeP1, onStartChargeP2, onCancelChargeP2, isOnline, isOnlineHost]);

  // Continuous keyboard movement tick: You can ONLY drive YOUR OWN robot!
  useEffect(() => {
    if (stage !== 'PLAYING') return;

    const interval = setInterval(() => {
      // 1. ONLINE GUEST: Controls Team 2 only (can use WASD or Arrow Keys)
      if (isOnline && !isOnlineHost) {
        let dx2 = 0;
        let dy2 = 0;
        if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dy2 -= 1;
        if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dy2 += 1;
        if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dx2 -= 1;
        if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dx2 += 1;

        if (dx2 !== 0 || dy2 !== 0) {
          onMoveP2(dx2, dy2);
        }
        return;
      }

      // 2. HOST OR LOCAL SOLO PLAYER: Controls Team 1 ONLY!
      // You can use BOTH WASD and Arrow Keys to drive your own robot with total convenience!
      let dx1 = 0;
      let dy1 = 0;

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) dy1 -= 1;
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) dy1 += 1;
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dx1 -= 1;
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dx1 += 1;

      if (dx1 !== 0 || dy1 !== 0) {
        onMoveP1(dx1, dy1);
      }
      // UNDER NO CIRCUMSTANCES DOES onMoveP2 GET CALLED HERE!
      // The opponent robot is strictly controlled by the AI bot or remote online friend!
    }, 30);

    return () => clearInterval(interval);
  }, [stage, onMoveP1, onMoveP2, isOnline, isOnlineHost]);

  const defaultKeys = isOnline && !isOnlineHost
    ? { p1Drive: 'WASD / ARROWS', p1Shoot: 'SPACE / ENTER' }
    : stationNumber === 1
    ? { p1Drive: 'WASD', p1Shoot: 'SPACE' }
    : stationNumber === 2
    ? { p1Drive: 'ARROWS', p1Shoot: 'ENTER' }
    : { p1Drive: 'IJKL', p1Shoot: 'P' };

  const activeKeys = controlKeysLabel || defaultKeys;

  const t1SecuredCount = team1Vault.securedCount ?? (team1Vault.isSecured ? 1 : 0);
  const t2SecuredCount = team2Vault.securedCount ?? (team2Vault.isSecured ? 1 : 0);

  return (
    <div className="relative w-full flex flex-col gap-2.5 select-none touch-manipulation">
      {/* BRAWL STARS / ROBLOX QUICK MODE BAR & ARENA HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/95 border border-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-xl">
        {/* Mode Badge & Online Match Invite */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <div className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black shadow-md">
            <Bot className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">
              {isOnline ? (isOnlineHost ? 'HOST VS REMOTE FRIEND' : 'GUEST VS HOST') : 'SOLO VS AI BOT'}
            </span>
          </div>

          {/* Online Match vs Friend in another country */}
          <button
            onClick={() => onOpenOnlineInvite?.()}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              isOnline
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md font-black ring-2 ring-indigo-400/50'
                : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="text-[11px] sm:text-xs">
              {isOnline ? `ONLINE (${onlinePing ?? 42}ms)` : '🌐 PLAY WITH FRIEND'}
            </span>
          </button>
        </div>

        {/* Bot Speed Multiplier Selector (When playing vs Bot) */}
        {!is2Player && !isOnline && onSelectBotSpeed && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-cyan-500/40 shadow">
            <span className="text-[10px] text-cyan-300 font-mono px-1 font-bold hidden sm:inline">BOT SPEED:</span>
            {[
              { val: 1, label: '1x Chill' },
              { val: 2, label: '2x Balanced' },
              { val: 4, label: '4x Turbo' },
              { val: 100, label: '⚡ 100x God' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => onSelectBotSpeed(val)}
                title={val === 2 ? '2x Balanced (Default) - Slower & controlled for smooth competitive rallies' : `${val}x Bot Speed`}
                className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  botSpeedMultiplier === val
                    ? val === 100
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 text-slate-950 shadow-md font-black ring-2 ring-yellow-300 animate-pulse scale-105'
                      : val === 2
                      ? 'bg-emerald-400 text-slate-950 shadow font-black scale-102 ring-1 ring-emerald-300'
                      : 'bg-cyan-500 text-slate-950 shadow font-black scale-102'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Purple Ball Indicator Badge: Exactly 1 Purple Ball per Side (Total 2 Purple Balls Only!) */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-purple-500/40 shadow">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500 animate-pulse" />
          <span className="text-[11px] text-purple-300 font-mono font-bold">
            1 🟣 per Side (Total 2) · Lock in Vault for -2 Marks
          </span>
        </div>

        {/* Round Duration Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono px-1 hidden md:inline">TIME:</span>
          {[30, 45, 60].map((secs) => (
            <button
              key={secs}
              onClick={() => onSelectRoundDuration?.(secs)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                Math.round(randomRoundDuration) === secs
                  ? 'bg-rose-500 text-white shadow font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>

        {/* Restart Button */}
        <button
          onClick={() => onRestartMatch?.()}
          className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black font-display rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESTART</span>
        </button>
      </div>

      {/* ONLINE REALTIME CROSS-COUNTRY BANNER */}
      {isOnline && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/50 rounded-2xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-2 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs text-indigo-200">
              <Globe2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="font-bold text-white">Cross-Country Match:</span>
              <span>Playing with <strong className="text-cyan-300 font-display">{remotePlayerName || 'Friend abroad'}</strong></span>
            </div>
            {onlinePing !== null && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {onlinePing}ms latency
              </span>
            )}
          </div>

          {/* Quick Emote Reactions */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">QUICK EMOTES:</span>
            {[
              { emoji: '🔥', text: 'Nice shot!' },
              { emoji: '⚡', text: 'Fast rally!' },
              { emoji: '🟣', text: 'Lock purple!' },
              { emoji: '👋', text: 'Hi from afar!' },
            ].map(({ emoji, text }) => (
              <button
                key={emoji}
                onClick={() => onSendEmote?.(`${emoji} ${text}`)}
                title={text}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 border border-slate-700 hover:border-indigo-400"
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-slate-300 hidden md:inline">{text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DOUBLE TENNIS COURT CONTAINER */}
      <div className="relative w-full h-[320px] sm:h-[400px] lg:h-[470px] rounded-2xl sm:rounded-3xl overflow-hidden border-2 sm:border-4 border-slate-700/80 shadow-2xl bg-[#14532d] p-2 sm:p-4">
        {/* White walled arena table */}
        <div className="relative w-full h-full bg-[#f8fafc] rounded-xl sm:rounded-2xl border-2 sm:border-4 border-slate-200 shadow-inner overflow-hidden">
          
          {/* Black Line Demarcation Grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[25%] inset-x-0 h-0.5 sm:h-1 bg-slate-900/80" />
            <div className="absolute top-[75%] inset-x-0 h-0.5 sm:h-1 bg-slate-900/80" />
            
            {/* Center horizontal divider wall */}
            <div className="absolute top-1/2 -translate-y-1/2 inset-x-4 sm:inset-x-6 h-2 sm:h-3 bg-white border border-slate-400 shadow-md z-10" />
            
            {/* Demarcation vertical lines */}
            <div className="absolute inset-y-0 left-[28%] w-1 sm:w-1.5 bg-slate-900/60" />
            <div className="absolute inset-y-0 right-[28%] w-1 sm:w-1.5 bg-slate-900/60" />
          </div>

          {/* CENTRAL RAMP: GREEN, BLUE, RED STRIPES */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 sm:w-24 flex pointer-events-none z-10 shadow-lg">
            <div className="flex-1 flex flex-col">
              <div className="h-1/2 flex">
                <div className="flex-1 bg-[#22c55e] border-r border-slate-300" />
                <div className="flex-1 bg-[#2563eb] border-r border-slate-300" />
                <div className="flex-1 bg-[#ef4444]" />
              </div>
              <div className="h-1/2 flex">
                <div className="flex-1 bg-[#22c55e] border-r border-slate-300" />
                <div className="flex-1 bg-[#2563eb] border-r border-slate-300" />
                <div className="flex-1 bg-[#ef4444]" />
              </div>
            </div>
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-amber-400/90 shadow" />
          </div>

          {/* TEAM 1 PURPLE VAULT BOX (CAN SAVE UP TO 2 PURPLE BALLS: -2 OR -4 MARKS!) */}
          <div
            className={`absolute z-30 rounded-2xl p-1.5 sm:p-2 border-2 sm:border-3 shadow-2xl flex flex-col items-center justify-center transition-all ${
              t1SecuredCount >= 2
                ? 'bg-gradient-to-b from-purple-900 via-indigo-950 to-slate-950 border-purple-300 ring-4 ring-purple-500 shadow-purple-600/80 scale-105'
                : t1SecuredCount === 1
                ? 'bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950 border-purple-400 ring-3 ring-purple-500/60 shadow-purple-600/50'
                : robot1.hasKey
                ? 'bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 border-emerald-400 ring-4 ring-emerald-400/80 animate-pulse scale-105'
                : 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-amber-400/80 ring-2 ring-slate-800'
            }`}
            style={{
              left: `${team1Vault.x}%`,
              top: `${team1Vault.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '108px',
              minHeight: '76px',
            }}
          >
            {t1SecuredCount >= 1 ? (
              <>
                <div className="flex items-center gap-1 text-purple-200">
                  <Lock className="w-4 h-4 text-purple-300 animate-bounce" />
                  <span className="text-[10px] font-black font-display">SAFE LOCKED!</span>
                </div>
                <div className="flex items-center gap-1.5 my-0.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500 border border-purple-200 shadow-sm flex items-center justify-center text-[8px] font-bold text-white">🟣</span>
                </div>
                <span className="text-[8px] font-mono font-black text-purple-100 bg-purple-900/90 px-1.5 py-0.5 rounded-full border border-purple-300 shadow">
                  🔒 -2 MARKS SAVED!
                </span>
              </>
            ) : robot1.hasKey ? (
              <>
                <div className="flex items-center gap-1 text-emerald-300">
                  <Unlock className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-black font-display">UNLOCKED!</span>
                </div>
                <span className="text-[8px] font-mono font-black text-slate-950 bg-emerald-400 px-1.5 py-0.5 rounded-full mt-1 animate-bounce shadow">
                  DROP PURPLE 🟣 (0/1)
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-amber-300">
                  <Box className="w-4 h-4 text-amber-400" />
                  <span className="text-[9px] font-black font-display uppercase">T1 SAFE BOX</span>
                </div>
                <span className="text-[8px] font-mono font-bold text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded-full mt-0.5 border border-amber-400/40">
                  NEED KEY 🔑 (0/1)
                </span>
              </>
            )}
          </div>

          {/* TEAM 2 PURPLE VAULT BOX (BOT / TEAM 2) */}
          <div
            className={`absolute z-30 rounded-2xl p-1.5 sm:p-2 border-2 sm:border-3 shadow-2xl flex flex-col items-center justify-center transition-all ${
              t2SecuredCount >= 1
                ? 'bg-gradient-to-b from-purple-900 via-indigo-950 to-slate-950 border-purple-300 ring-4 ring-purple-500 shadow-purple-600/80 scale-105'
                : robot2.hasKey
                ? 'bg-gradient-to-b from-cyan-900 via-slate-900 to-slate-950 border-cyan-400 ring-4 ring-cyan-400/80 animate-pulse scale-105'
                : 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-cyan-400/80 ring-2 ring-slate-800'
            }`}
            style={{
              left: `${team2Vault.x}%`,
              top: `${team2Vault.y}%`,
              transform: 'translate(-50%, -50%)',
              width: '108px',
              minHeight: '76px',
            }}
          >
            {t2SecuredCount >= 1 ? (
              <>
                <div className="flex items-center gap-1 text-purple-200">
                  <Lock className="w-4 h-4 text-purple-300 animate-bounce" />
                  <span className="text-[10px] font-black font-display">SAFE LOCKED!</span>
                </div>
                <div className="flex items-center gap-1.5 my-0.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500 border border-purple-200 shadow-sm flex items-center justify-center text-[8px] font-bold text-white">🟣</span>
                </div>
                <span className="text-[8px] font-mono font-black text-purple-100 bg-purple-900/90 px-1.5 py-0.5 rounded-full border border-purple-300 shadow">
                  🔒 -2 MARKS SAVED!
                </span>
              </>
            ) : robot2.hasKey ? (
              <>
                <div className="flex items-center gap-1 text-cyan-300">
                  <Unlock className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-black font-display">UNLOCKED!</span>
                </div>
                <span className="text-[8px] font-mono font-black text-slate-950 bg-cyan-400 px-1.5 py-0.5 rounded-full mt-1 animate-bounce shadow">
                  DROP PURPLE 🟣 (0/1)
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-cyan-300">
                  <Box className="w-4 h-4 text-cyan-400" />
                  <span className="text-[9px] font-black font-display uppercase">{isOnline ? `${player2Name}'S SAFE` : 'BOT SAFE BOX'}</span>
                </div>
                <span className="text-[8px] font-mono font-bold text-cyan-300 bg-cyan-950/90 px-1.5 py-0.5 rounded-full mt-0.5 border border-cyan-400/40">
                  NEED KEY 🔑 (0/1)
                </span>
              </>
            )}
          </div>

          {/* TEAM 1 GOLDEN KEY */}
          {!team1Key.isCollected && (
            <div
              className="absolute z-30 pointer-events-none transition-transform animate-bounce"
              style={{
                left: `${team1Key.x}%`,
                top: `${team1Key.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex flex-col items-center">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] shadow-lg border border-amber-200 uppercase tracking-tight mb-1 animate-pulse">
                  🔑 T1 KEY
                </span>
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-white shadow-2xl flex items-center justify-center ring-4 ring-amber-400/60 shadow-amber-500/50">
                  <Key className="w-6 h-6 text-slate-950 fill-slate-950" />
                </div>
                <span className="text-[8px] font-bold text-slate-950 bg-amber-300 px-1.5 rounded mt-0.5 shadow">
                  GRAB TO UNLOCK SAFE
                </span>
              </div>
            </div>
          )}

          {/* TEAM 2 GOLDEN KEY */}
          {!team2Key.isCollected && (
            <div
              className="absolute z-30 pointer-events-none transition-transform animate-bounce"
              style={{
                left: `${team2Key.x}%`,
                top: `${team2Key.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex flex-col items-center">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] shadow-lg border border-amber-200 uppercase tracking-tight mb-1 animate-pulse">
                  🔑 {is2Player ? 'T2 KEY' : 'BOT KEY'}
                </span>
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-white shadow-2xl flex items-center justify-center ring-4 ring-amber-400/60 shadow-amber-500/50">
                  <Key className="w-6 h-6 text-slate-950 fill-slate-950" />
                </div>
                <span className="text-[8px] font-bold text-slate-950 bg-amber-300 px-1.5 rounded mt-0.5 shadow">
                  GRAB TO UNLOCK SAFE
                </span>
              </div>
            </div>
          )}

          {/* COURT STRATEGY LIVE SCORE BADGES */}
          <div className="absolute top-1.5 sm:top-2 left-24 sm:left-32 bg-slate-900/90 border border-rose-500/60 rounded-lg px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5 pointer-events-none z-20 shadow">
            <span>T1: {matchScore.team1Marks} MARKS</span>
            <span className="text-slate-400 font-normal text-[9px] sm:text-[11px] hidden xs:inline">
              ({matchScore.team1Orange} 🟠 · {matchScore.team1Purple} 🟣 {t1SecuredCount > 0 && '· 🔒 -2 SAFE'})
            </span>
          </div>

          <div className="absolute top-1.5 sm:top-2 right-24 sm:right-32 bg-slate-900/90 border border-cyan-500/60 rounded-lg px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 pointer-events-none z-20 shadow">
            <span>T2: {matchScore.team2Marks} MARKS</span>
            <span className="text-slate-400 font-normal text-[9px] sm:text-[11px] hidden xs:inline">
              ({matchScore.team2Orange} 🟠 · {matchScore.team2Purple} 🟣 {t2SecuredCount > 0 && '· 🔒 -2 SAFE'})
            </span>
          </div>

          {/* 10-SECOND KNOCKOUT (KO) COUNTDOWN ALERT */}
          {koState && koState.active && (
            <div className="absolute top-10 sm:top-12 inset-x-3 sm:inset-x-8 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-red-950 via-slate-950 to-red-950 border-2 border-red-500 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_35px_rgba(239,68,68,0.8)] flex items-center justify-between gap-2 animate-pulse backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 border border-red-300 flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-lg animate-ping">
                    KO
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black font-display text-white uppercase tracking-tight flex items-center gap-2 flex-wrap">
                      <span>🚨 ALL 8 ORANGE BALLS ON {koState.dangerSide === 'team1' ? 'YOUR COURT' : 'OPPONENT COURT'}!</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-black animate-bounce">
                        {koState.dangerSide === 'team1' ? 'DEFEND: CLEAR 1 BALL!' : 'ATTACK: HOLD POSITION!'}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-red-200 font-mono mt-0.5">
                      {koState.dangerSide === 'team1'
                        ? 'Clear at least 1 orange ball over the ramp in 10s or LOSE BY KO (9 to -4 marks)!'
                        : 'Keep all 8 orange balls on opponent side in 10s to WIN BY KO (-4 to 9 marks)!'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 bg-black/90 px-3 sm:px-4 py-1.5 rounded-xl border border-red-400 shadow">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase hidden xs:inline">KO IN:</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono-nums text-amber-300 animate-bounce">
                    {koState.secondsLeft.toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FINAL 10 SECONDS WARNING IN ARENA */}
          {timeRemaining <= 10.0 && timeRemaining > 0 && stage === 'PLAYING' && !koState?.active && (
            <div className="absolute top-10 sm:top-12 inset-x-8 z-30 pointer-events-none flex justify-center animate-in fade-in duration-200">
              <div className="bg-amber-950/90 border-2 border-amber-400 rounded-2xl px-4 py-1.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center gap-2 animate-bounce backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs sm:text-sm font-black font-display text-amber-300 uppercase tracking-widest">
                  ⏱️ FINAL {Math.ceil(timeRemaining)} SECONDS! DRIVE & SHOOT!
                </span>
              </div>
            </div>
          )}

          {/* ROBOT 1 (Player 1) */}
          <div
            className="absolute z-20 pointer-events-none flex flex-col items-center"
            style={{
              left: `${robot1.x}%`,
              top: `${robot1.y}%`,
              transform: `translate(-50%, -50%) rotate(${robot1.angle}deg)`,
            }}
          >
            {/* Overhead Nametag */}
            <div className="absolute -top-11 flex flex-col items-center gap-0.5 whitespace-nowrap">
              <span className="px-2 py-0.5 bg-rose-600 border border-rose-300 text-white font-black text-[9px] rounded-full shadow-lg">
                👑 P1: {playerRobot.name}
              </span>
              {robot1.hasKey && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[8px] rounded-full shadow animate-bounce flex items-center gap-1 border border-amber-200">
                  <Key className="w-2.5 h-2.5 fill-slate-950" />
                  KEY READY ➔ GO TO SAFE BOX!
                </span>
              )}
            </div>

            {/* Aim Directional Beam */}
            <div className="absolute -top-7 w-3 h-7 bg-gradient-to-t from-rose-500/60 to-transparent pointer-events-none blur-[1px]" />

            {/* Chassis */}
            <div className="relative w-13 h-13 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-rose-500 via-red-600 to-amber-500 border-2 border-white shadow-2xl">
              <img
                src={playerRobot.image || '/images/player_robot_1790947974702.jpg'}
                alt="Robot 1"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-300" />
            </div>

            {/* Hopper Capacity Indicator */}
            <div className="mt-1 bg-slate-950/95 border border-rose-500/80 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg">
              <span className="text-[8px] sm:text-[9px] font-mono font-black text-white">
                {robot1.heldBalls.length}/5
              </span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => {
                  const ball = robot1.heldBalls[i];
                  return (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full border border-slate-900 ${
                        !ball
                          ? 'bg-slate-700/60'
                          : ball.type === 'purple'
                          ? 'bg-purple-500 shadow-sm shadow-purple-500 animate-pulse'
                          : 'bg-orange-500 shadow-sm shadow-orange-500'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* 1-Second Charge Progress Gauge for Robot 1 */}
            {p1ChargeTime > 0 && (
              <div className="absolute -bottom-8 flex flex-col items-center gap-0.5 whitespace-nowrap z-30">
                <div className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded-full shadow-lg border border-amber-200 flex items-center gap-1 animate-pulse">
                  <Zap className="w-2.5 h-2.5 fill-slate-950" />
                  <span>CHARGING: {p1ChargeTime.toFixed(1)}s / 1.0s</span>
                </div>
                <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-amber-300 shadow">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, (p1ChargeTime / 1.0) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ROBOT 2 (Opponent / Bot) */}
          <div
            className="absolute z-20 pointer-events-none flex flex-col items-center"
            style={{
              left: `${robot2.x}%`,
              top: `${robot2.y}%`,
              transform: `translate(-50%, -50%) rotate(${robot2.angle}deg)`,
            }}
          >
            {/* Overhead Nametag */}
            <div className="absolute -top-12 flex flex-col items-center gap-0.5 whitespace-nowrap">
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 bg-cyan-600 border border-cyan-300 text-white font-black text-[9px] rounded-full shadow-lg">
                  {is2Player ? `👥 P2: ${player2Name}` : `🤖 AI BOT: ${opponent.name}`}
                </span>
                {!is2Player && botSpeedMultiplier === 100 && (
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 text-slate-950 font-black text-[8px] rounded-full shadow border border-white animate-pulse flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-slate-950" />
                    100X
                  </span>
                )}
                {!is2Player && botSpeedMultiplier && botSpeedMultiplier > 1 && botSpeedMultiplier < 100 && (
                  <span className="px-1.5 py-0.5 bg-cyan-500 text-slate-950 font-black text-[8px] rounded-full shadow border border-cyan-200">
                    {botSpeedMultiplier}X
                  </span>
                )}
              </div>
              {robot2.hasKey && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[8px] rounded-full shadow animate-bounce flex items-center gap-1 border border-amber-200">
                  <Key className="w-2.5 h-2.5 fill-slate-950" />
                  KEY READY ➔ GO TO SAFE BOX!
                </span>
              )}
            </div>

            {/* Aim Directional Beam */}
            <div className={`absolute -top-7 ${botSpeedMultiplier && botSpeedMultiplier >= 50 && !is2Player ? 'w-4 h-9 bg-gradient-to-t from-cyan-400 to-transparent' : 'w-3 h-7 bg-gradient-to-t from-cyan-500/60 to-transparent'} pointer-events-none blur-[1px]`} />

            {/* Chassis with 100x Speed Aura */}
            <div className="relative">
              {/* Electric 100X Plasma Aura */}
              {!is2Player && botSpeedMultiplier && botSpeedMultiplier >= 10 && (
                <div
                  className={`absolute -inset-2 rounded-2xl pointer-events-none ${
                    botSpeedMultiplier === 100
                      ? 'bg-gradient-to-tr from-cyan-400/40 via-yellow-400/50 to-orange-500/40 blur-sm animate-pulse'
                      : 'bg-cyan-400/30 blur-sm animate-pulse'
                  }`}
                />
              )}

              {/* Twin Plasma Jet Flames behind Bot */}
              {!is2Player && botSpeedMultiplier && botSpeedMultiplier >= 10 && (
                <div className="absolute -bottom-5 inset-x-2 flex justify-between pointer-events-none z-0">
                  <div
                    className={`w-2.5 h-6 rounded-full blur-[1px] transform -rotate-12 animate-pulse ${
                      botSpeedMultiplier === 100
                        ? 'bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent shadow-[0_0_10px_#f59e0b]'
                        : 'bg-gradient-to-b from-cyan-300 via-blue-500 to-transparent'
                    }`}
                  />
                  <div
                    className={`w-2.5 h-6 rounded-full blur-[1px] transform rotate-12 animate-pulse ${
                      botSpeedMultiplier === 100
                        ? 'bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent shadow-[0_0_10px_#f59e0b]'
                        : 'bg-gradient-to-b from-cyan-300 via-blue-500 to-transparent'
                    }`}
                  />
                </div>
              )}

              <div className={`relative w-13 h-13 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-1 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 border-2 border-white shadow-2xl z-10 ${botSpeedMultiplier === 100 && !is2Player ? 'ring-4 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : ''}`}>
                <img
                  src={opponent.image || '/images/rival_robot_1790947986992.jpg'}
                  alt="Robot 2"
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute top-0 inset-x-0 h-1.5 bg-cyan-300" />
              </div>
            </div>

            {/* Hopper Capacity Indicator */}
            <div className="mt-1 bg-slate-950/95 border border-cyan-500/80 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg">
              <span className="text-[8px] sm:text-[9px] font-mono font-black text-white">
                {robot2.heldBalls.length}/5
              </span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => {
                  const ball = robot2.heldBalls[i];
                  return (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full border border-slate-900 ${
                        !ball
                          ? 'bg-slate-700/60'
                          : ball.type === 'purple'
                          ? 'bg-purple-500 shadow-sm shadow-purple-500 animate-pulse'
                          : 'bg-orange-500 shadow-sm shadow-orange-500'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* 1-Second Charge Progress Gauge for Robot 2 (Guest or AI Bot) */}
            {((p2ChargeTime ?? 0) > 0 || (botChargeTime ?? 0) > 0) && (
              <div className="absolute -bottom-8 flex flex-col items-center gap-0.5 whitespace-nowrap z-30">
                <div className="px-2 py-0.5 bg-cyan-400 text-slate-950 font-black text-[9px] rounded-full shadow-lg border border-cyan-200 flex items-center gap-1 animate-pulse">
                  <Zap className="w-2.5 h-2.5 fill-slate-950" />
                  <span>CHARGING: {((p2ChargeTime ?? 0) || (botChargeTime ?? 0)).toFixed(1)}s / 1.0s</span>
                </div>
                <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden border border-cyan-300 shadow">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, (((p2ChargeTime ?? 0) || (botChargeTime ?? 0)) / 1.0) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TENNIS BALLS ON COURT */}
          {balls
            .filter((b) => b.isCarriedBy === 'none' && !b.isSecuredInVault)
            .map((ball) => {
              const isPurple = ball.type === 'purple';
              return (
                <div
                  key={ball.id}
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: `${ball.x}%`,
                    top: `${ball.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className={`rounded-full shadow-lg flex items-center justify-center transition-transform ${
                      ball.inAir ? 'w-7 h-7 sm:w-8 sm:h-8 scale-125 shadow-2xl ring-4' : 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7'
                    } ${
                      isPurple
                        ? 'bg-gradient-to-br from-purple-400 via-purple-600 to-indigo-950 border-2 border-purple-200 ring-2 ring-purple-400 shadow-purple-500/50'
                        : 'bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 border-2 border-white ring-2 ring-orange-400 shadow-orange-500/50'
                    }`}
                  >
                    <span className="text-[8px] sm:text-[9px] font-mono font-black text-white drop-shadow-md">
                      {isPurple ? '-2' : '+1'}
                    </span>
                  </div>
                </div>
              );
            })}

          {/* FLOATING EMOTE REACTIONS */}
          {floatingEmotes.map((em) => (
            <div
              key={em.id}
              className="absolute z-40 pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-300 animate-bounce"
              style={{ left: `${em.x}%`, top: `${em.y}%` }}
            >
              <div className="bg-slate-950/95 text-white border-2 border-indigo-400 font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap animate-pulse">
                <span>{em.text}</span>
              </div>
            </div>
          ))}

          {/* COUNTDOWN OVERLAY: 3, 2, 1, BRAWL! */}
          {stage === 'COUNTDOWN' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
              {countdownNumber !== null ? (
                <div className="text-center animate-bounce">
                  <div className="text-8xl sm:text-9xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)]">
                    {countdownNumber === 0 ? 'BRAWL!' : countdownNumber}
                  </div>
                  <p className="text-sm sm:text-base font-black text-amber-300 tracking-widest uppercase mt-3 drop-shadow">
                    {countdownNumber === 0 ? "REFEREE WHISTLE! DRIVE & SHOOT!" : 'GET READY TO BRAWL...'}
                  </p>
                </div>
              ) : isOnline && !isOnlineHost ? (
                <div className="text-center p-6 bg-slate-900/90 border border-indigo-500/50 rounded-3xl shadow-2xl max-w-sm mx-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center mb-3">
                    <Globe2 className="w-8 h-8 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="text-lg font-black font-display text-white">CONNECTED TO HOST!</div>
                  <p className="text-xs text-indigo-300 mt-1">Waiting for host to launch the match...</p>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold bg-slate-950 px-3 py-1.5 rounded-full border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>SYNCHRONIZED & READY</span>
                  </div>
                </div>
              ) : null}

              {/* Fast Skip Option (Solo mode only) */}
              {!isOnline && countdownNumber !== null && (
                <button
                  onClick={onSkipCountdown}
                  className="mt-6 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>SKIP TO BRAWL NOW ➔</span>
                </button>
              )}
            </div>
          )}

          {/* ROUND OVER BUZZER OVERLAY */}
          {stage === 'ROUND_OVER' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center p-5 sm:p-7 bg-slate-900 border-2 border-amber-400 rounded-3xl shadow-2xl max-w-md mx-4">
                {matchScore.isKO ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-400 text-xs font-black font-mono uppercase tracking-widest mb-2 animate-bounce">
                      <span>💥 OFFICIAL KNOCKOUT (KO)</span>
                    </div>

                    <div className="text-3xl sm:text-5xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                      {matchScore.koWinner === 'team1' ? `${playerRobot.name} WINS!` : `${player2Name} WINS!`}
                    </div>

                    <div className="my-3 py-2 px-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around gap-2 text-center">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">WINNER</div>
                        <div className="text-2xl sm:text-3xl font-black font-mono-nums text-emerald-400">
                          -4 <span className="text-xs text-slate-400 font-normal">marks</span>
                        </div>
                      </div>
                      <div className="text-lg font-black text-slate-600 font-mono">VS</div>
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">LOSER (TRAPPED)</div>
                        <div className="text-2xl sm:text-3xl font-black font-mono-nums text-rose-500">
                          +9 <span className="text-xs text-slate-400 font-normal">marks</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                      All 8 Orange Balls stayed on one side for 10.0 seconds! <br />
                      <strong className="text-amber-300">The less marks, the bigger victory!</strong> Winner receives -4 marks, loser receives 9 marks.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl sm:text-5xl font-black font-display text-amber-400">
                      TIME EXPIRED!
                    </div>
                    <div className="my-3 py-2 px-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around gap-2 text-center">
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">{playerRobot.name}</div>
                        <div className="text-2xl sm:text-3xl font-black font-mono-nums text-rose-400">
                          {matchScore.team1Marks > 0 ? `+${matchScore.team1Marks}` : matchScore.team1Marks} <span className="text-xs text-slate-400 font-normal">marks</span>
                        </div>
                      </div>
                      <div className="text-lg font-black text-slate-600 font-mono">VS</div>
                      <div>
                        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">{player2Name}</div>
                        <div className="text-2xl sm:text-3xl font-black font-mono-nums text-cyan-400">
                          {matchScore.team2Marks > 0 ? `+${matchScore.team2Marks}` : matchScore.team2Marks} <span className="text-xs text-slate-400 font-normal">marks</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm mt-1 sm:mt-2">
                      Judge Derrick certified marks: Orange (+1) vs Purple & Vault (-2 or -4). <strong className="text-amber-300">Less marks wins!</strong>
                    </p>
                  </>
                )}

                {/* Tournament Ladder Status in Round Over */}
                {tournamentInfo && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-2xl border border-amber-400/50 flex flex-col items-center gap-1">
                    <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      {tournamentInfo.isGrandFinals ? '🏆 WRO GRAND FINALS' : `🏆 TOURNAMENT STAGE 0${tournamentInfo.stage}`}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white">
                      {tournamentInfo.isChampion ? (
                        <span className="text-amber-400">🎉 WORLD CHAMPION! DEFEATED TEAM TAIWAN!</span>
                      ) : tournamentInfo.stageCleared ? (
                        <span className="text-emerald-400">✨ STAGE CLEARED! ADVANCED TO STAGE {tournamentInfo.stage}!</span>
                      ) : tournamentInfo.isP1Win ? (
                        <span className="text-cyan-300">Match Won! ({tournamentInfo.matchNumber}/{tournamentInfo.requiredWins} Wins in Stage)</span>
                      ) : (
                        <span className="text-rose-400">Match Lost · Rematch ready to get {tournamentInfo.requiredWins} wins!</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => onRestartMatch?.()}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer text-xs sm:text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{tournamentInfo?.isP1Win ? 'NEXT TOURNAMENT MATCH' : 'PLAY REMATCH'}</span>
                  </button>

                  {onViewTournamentLadder && (
                    <button
                      onClick={onViewTournamentLadder}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 cursor-pointer text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>TOURNAMENT LADDER</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE & TABLET ERGONOMIC TOUCH CONTROLLER (YOUR ROBOT ONLY) */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {isOnline && !isOnlineHost ? (
          /* TEAM 2 CONTROLLER (When playing as Guest in Online Match) */
          <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <VirtualJoystick
                onMove={onMoveP2}
                color="cyan"
                label="YOUR JOYSTICK (WASD / ARROWS)"
                size={94}
              />
              <div className="hidden sm:block text-xs text-slate-400">
                <div className="font-bold text-cyan-300 font-display uppercase">{player2Name} (YOUR ROBOT)</div>
                <div className="text-[11px] text-slate-400">Drive: <kbd className="px-1 bg-slate-800 rounded text-cyan-300 font-mono text-[10px]">WASD / Arrows</kbd> · Shoot: <kbd className="px-1 bg-slate-800 rounded text-cyan-300 font-mono text-[10px]">SPACE / ENTER</kbd></div>
                <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                  Hopper: {robot2.heldBalls.length}/5 · {robot2.hasKey ? '🔑 Key Held' : '🔑 Find Key'} {t2SecuredCount > 0 && `· 🔒 Vault ${t2SecuredCount}/2`}
                </div>
              </div>
            </div>

            <button
              onPointerDown={onStartChargeP2}
              onPointerUp={onCancelChargeP2}
              onPointerLeave={onCancelChargeP2}
              onContextMenu={(e) => e.preventDefault()}
              disabled={robot2.heldBalls.length === 0 || stage !== 'PLAYING'}
              className={`min-w-[130px] sm:min-w-[180px] py-3 sm:py-4 px-3 sm:px-5 rounded-2xl font-display font-black text-xs sm:text-base transition-all shadow-xl active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-manipulation ${
                robot2.heldBalls.length > 0 && stage === 'PLAYING'
                  ? p2ChargeTime > 0
                    ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white border-2 border-white ring-4 ring-cyan-400 shadow-cyan-500/50 scale-102'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 border-2 border-cyan-200 ring-2 ring-cyan-400/40 shadow-blue-900/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {p2ChargeTime > 0 ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="flex items-center gap-1.5 text-white text-xs sm:text-sm font-black">
                    <Zap className="w-4 h-4 animate-spin text-amber-300" />
                    <span>CHARGING {p2ChargeTime.toFixed(1)}s / 1.0s</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-cyan-300">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-300 to-amber-300"
                      style={{ width: `${Math.min(100, (p2ChargeTime / 1.0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-cyan-200 font-bold">HOLD 1.0s TO BLAST!</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>HOLD 1s TO SHOOT</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-900">
                    {robot2.heldBalls.length} IN HOPPER (PRESS & HOLD SPACE)
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* TEAM 1 CONTROLLER (When Host or Local Solo player vs Bot) */
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <VirtualJoystick
                onMove={onMoveP1}
                color="rose"
                label="YOUR JOYSTICK (WASD / ARROWS)"
                size={94}
              />
              <div className="hidden sm:block text-xs text-slate-400">
                <div className="font-bold text-rose-300 font-display uppercase">{playerRobot.name} (YOUR ROBOT)</div>
                <div className="text-[11px] text-slate-400">Drive: <kbd className="px-1 bg-slate-800 rounded text-amber-300 font-mono text-[10px]">WASD / Arrows</kbd> · Shoot: <kbd className="px-1 bg-slate-800 rounded text-amber-300 font-mono text-[10px]">SPACE / ENTER</kbd></div>
                <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                  Hopper: {robot1.heldBalls.length}/5 · {robot1.hasKey ? '🔑 Key Held' : '🔑 Find Key'} {t1SecuredCount > 0 && `· 🔒 Vault ${t1SecuredCount}/2`}
                </div>
              </div>
            </div>

            <button
              onPointerDown={onStartChargeP1}
              onPointerUp={onCancelChargeP1}
              onPointerLeave={onCancelChargeP1}
              onClick={() => onShootP1()}
              onContextMenu={(e) => e.preventDefault()}
              disabled={robot1.heldBalls.length === 0 || stage !== 'PLAYING'}
              className={`min-w-[130px] sm:min-w-[180px] py-3 sm:py-4 px-3 sm:px-5 rounded-2xl font-display font-black text-xs sm:text-base transition-all shadow-xl active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer select-none touch-manipulation ${
                robot1.heldBalls.length > 0 && stage === 'PLAYING'
                  ? p1ChargeTime > 0
                    ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 text-slate-950 border-2 border-white ring-4 ring-amber-400 shadow-rose-900/50 scale-102'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 border-2 border-amber-300 ring-2 ring-amber-400/40 shadow-rose-900/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {p1ChargeTime > 0 ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="flex items-center gap-1.5 text-slate-950 text-xs sm:text-sm font-black">
                    <Zap className="w-4 h-4 animate-spin text-slate-950" />
                    <span>CHARGING {p1ChargeTime.toFixed(1)}s / 1.0s</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-amber-400">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-300"
                      style={{ width: `${Math.min(100, (p1ChargeTime / 1.0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-900 font-bold">HOLD 1.0s TO BLAST!</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>HOLD 1s TO SHOOT</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-900">
                    {robot1.heldBalls.length} IN HOPPER (PRESS & HOLD SPACE)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* QUICK TACTICAL HINT */}
      <div className="p-2 sm:p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
        <div className="flex items-center gap-1 sm:gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span><strong>Vault Tactic:</strong> You can choose to save up to 2 Purple Balls in your Vault Safe 📦 for up to <strong>-4 Marks saved</strong>! Grab Golden Key 🔑 first.</span>
        </div>
        <span className="text-amber-400 font-mono hidden md:inline">Duration: {randomRoundDuration.toFixed(0)}s</span>
      </div>
    </div>
  );
};
