import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerProfile, MatchStage, JudgeMood, MatchScore, TennisBall, CourtRobot, VaultBox, KeyItem, OpponentBot } from '../types/game';
import { RoboArena } from './RoboArena';
import { ScoreBoard } from './ScoreBoard';
import { JudgeDerrick } from './JudgeDerrick';
import { sound } from '../services/audioService';
import { storage } from '../services/storageService';
import { createCourtBalls } from './ballUtils';
import { onlineService, OnlineMessage, OnlineState } from '../services/onlineService';
import { OnlineInviteModal } from './OnlineInviteModal';
import { tournamentService } from '../services/tournamentService';

interface RoboGameStationProps {
  stationIndex: 1 | 2 | 3;
  profile: PlayerProfile;
  onUpdateProfile: (profile: PlayerProfile) => void;
  isCompactLayout?: boolean;
  initialRoomCode?: string;
  onClearInitialRoomCode?: () => void;
  forceOpenInviteModal?: boolean;
  onCloseForceOpenInviteModal?: () => void;
  tournamentOpponent?: OpponentBot;
  onTournamentWin?: (info: { stageCleared: boolean; becameChampion: boolean }) => void;
  onNavigateToTournament?: () => void;
}

const INITIAL_ROBOT_1: CourtRobot = {
  id: 'r1',
  name: 'Crimson Striker',
  team: 'team1',
  x: 20,
  y: 50,
  vx: 0,
  vy: 0,
  angle: 0,
  heldBalls: [],
  maxCapacity: 5,
  color: '#ef4444',
  hasKey: false,
};

const INITIAL_ROBOT_2: CourtRobot = {
  id: 'r2',
  name: 'CyberClaw',
  team: 'team2',
  x: 80,
  y: 50,
  vx: 0,
  vy: 0,
  angle: 180,
  heldBalls: [],
  maxCapacity: 5,
  color: '#06b6d4',
  hasKey: false,
};

export const RoboGameStation: React.FC<RoboGameStationProps> = ({
  stationIndex,
  profile,
  onUpdateProfile,
  isCompactLayout = false,
  initialRoomCode,
  onClearInitialRoomCode,
  forceOpenInviteModal,
  onCloseForceOpenInviteModal,
  tournamentOpponent,
  onTournamentWin,
  onNavigateToTournament,
}) => {
  // Opponents for each station
  const defaultOpponents: OpponentBot[] = [
    {
      id: 'bot_pupil',
      name: 'RoboPupil Mk-1',
      team: 'Tech Academy High',
      country: 'Japan',
      image: '/images/rival_robot_1790947986992.jpg',
      speed: 1.3,
      shootAccuracy: 0.75,
      difficulty: 'Rookie',
      quote: "Our school lab built this robot to compete in Double Tennis!",
    },
    {
      id: 'bot_cyberclaw',
      name: 'CyberClaw S2',
      team: 'Neon Circuit Club',
      country: 'Germany',
      image: '/images/rival_robot_1790947986992.jpg',
      speed: 1.7,
      shootAccuracy: 0.88,
      difficulty: 'National',
      quote: "We spent months tuning our double tennis kickers. Get ready!",
    },
    {
      id: 'bot_titan',
      name: 'Apex Titan WRO',
      team: 'Dynasty Robotics',
      country: 'United States',
      image: '/images/rival_robot_1790947986992.jpg',
      speed: 2.1,
      shootAccuracy: 0.95,
      difficulty: 'World Class',
      quote: "World Grand Final Champion. Judge Derrick knows our clearing speed is unmatched!",
    },
  ];

  // In primary solo mode, opponent tracks tournament ladder stage progression!
  const tournamentProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
  const ladderOpponent = tournamentService.getCurrentOpponent(tournamentProgress);
  const currentOpponent = tournamentOpponent || (stationIndex === 1 && !isCompactLayout ? ladderOpponent : defaultOpponents[stationIndex - 1]) || defaultOpponents[0];

  // Match State: Initialized in COUNTDOWN with 3 2 1 so players have time to prepare!
  const [matchStage, setMatchStage] = useState<MatchStage>('COUNTDOWN');
  const [judgeMood, setJudgeMood] = useState<JudgeMood>('COUNTDOWN');
  const [judgeCommentary, setJudgeCommentary] = useState<string>(
    `"SCREEN #${stationIndex}: 3, 2, 1, BRAWL! Grab Key 🔑, secure Purple Balls 🟣 in Vault Safe!"`
  );
  const [timeRemaining, setTimeRemaining] = useState<number>(45.0);
  const [randomRoundDuration, setRandomRoundDuration] = useState<number>(45.0);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(3);

  // Tournament Result Tracking
  const [lastTournamentResult, setLastTournamentResult] = useState<{
    stage: 1 | 2 | 3;
    matchNumber: number;
    requiredWins: number;
    isGrandFinals: boolean;
    isChampion: boolean;
    stageCleared: boolean;
    isP1Win: boolean;
  } | null>(null);

  // 2-Player Local & Online option per station
  const [is2Player, setIs2Player] = useState<boolean>(false);
  const [player2Name, setPlayer2Name] = useState<string>(`Challenger (P2)`);

  // Online Multiplayer with friends in another country
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);
  const isOnlineModeRef = useRef<boolean>(false);
  isOnlineModeRef.current = isOnlineMode;

  const [isOnlineHost, setIsOnlineHost] = useState<boolean>(true);
  const isOnlineHostRef = useRef<boolean>(true);
  isOnlineHostRef.current = isOnlineHost;

  const [remotePlayerName, setRemotePlayerName] = useState<string>('Friend abroad');
  const [onlinePing, setOnlinePing] = useState<number | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [floatingEmotes, setFloatingEmotes] = useState<Array<{ id: number; text: string; sender: 'p1' | 'p2'; x: number; y: number }>>([]);

  // Bot Speed Multiplier: default 2 (Balanced competitive speed, slower a little bit than god speed!)
  const initialBotSpeed = profile.botSpeedMultiplier === 100 ? 2 : (profile.botSpeedMultiplier || 2);
  const [botSpeedMultiplier, setBotSpeedMultiplier] = useState<number>(initialBotSpeed);

  // Exactly 1 Purple Ball on Left, 1 Purple Ball on Right (Total 2 Purple Balls Only!)
  const [balls, setBalls] = useState<TennisBall[]>(() => createCourtBalls());

  const [robot1, setRobot1] = useState<CourtRobot>({
    ...INITIAL_ROBOT_1,
    name: profile.name || profile.robot.name,
    color: profile.color,
  });

  const [robot2, setRobot2] = useState<CourtRobot>({
    ...INITIAL_ROBOT_2,
    name: currentOpponent.name,
  });

  // Vault Boxes - holds the 1 purple ball per team to save -2 marks!
  const [team1Vault, setTeam1Vault] = useState<VaultBox>({
    team: 'team1',
    x: 12,
    y: 18,
    isSecured: false,
    securedCount: 0,
    maxCapacity: 1,
  });

  const [team2Vault, setTeam2Vault] = useState<VaultBox>({
    team: 'team2',
    x: 88,
    y: 18,
    isSecured: false,
    securedCount: 0,
    maxCapacity: 1,
  });

  const [team1Key, setTeam1Key] = useState<KeyItem>({
    id: `key1_${stationIndex}`,
    team: 'team1',
    x: 18,
    y: 76,
    isCollected: false,
    carriedBy: 'none',
  });

  const [team2Key, setTeam2Key] = useState<KeyItem>({
    id: `key2_${stationIndex}`,
    team: 'team2',
    x: 82,
    y: 76,
    isCollected: false,
    carriedBy: 'none',
  });

  // Match Score (4 Orange + 1 Purple per side = 4 - 2 = 2 marks initially)
  const [score, setScore] = useState<MatchScore>({
    team1Orange: 4,
    team1Purple: 1,
    team1Marks: 2,
    team1VaultSecured: false,
    team1VaultSecuredCount: 0,
    team2Orange: 4,
    team2Purple: 1,
    team2Marks: 2,
    team2VaultSecured: false,
    team2VaultSecuredCount: 0,
    team1Shots: 0,
    team2Shots: 0,
    randomRoundDuration: 45.0,
    winner: null,
  });

  // 1-Second Charge-to-Shoot State & Refs (Space must be held 1s to shoot!)
  const [p1ChargeTime, setP1ChargeTime] = useState<number>(0);
  const [p2ChargeTime, setP2ChargeTime] = useState<number>(0);
  const [botChargeTime, setBotChargeTime] = useState<number>(0);

  // 10-Second Knockout (KO) Countdown State & Refs
  const [koState, setKoState] = useState<{ active: boolean; dangerSide: 'team1' | 'team2'; secondsLeft: number } | null>(null);

  // Fast Refs for 60 FPS Physics & AI loop
  const botSpeedMultiplierRef = useRef<number>(botSpeedMultiplier);
  botSpeedMultiplierRef.current = botSpeedMultiplier;

  const physicsLoopRef = useRef<number | null>(null);
  const matchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ballsRef = useRef<TennisBall[]>(balls);
  ballsRef.current = balls;

  const robot1Ref = useRef<CourtRobot>(robot1);
  robot1Ref.current = robot1;

  const robot2Ref = useRef<CourtRobot>(robot2);
  robot2Ref.current = robot2;

  const team1KeyRef = useRef<KeyItem>(team1Key);
  team1KeyRef.current = team1Key;

  const team2KeyRef = useRef<KeyItem>(team2Key);
  team2KeyRef.current = team2Key;

  const team1VaultRef = useRef<VaultBox>(team1Vault);
  team1VaultRef.current = team1Vault;

  const team2VaultRef = useRef<VaultBox>(team2Vault);
  team2VaultRef.current = team2Vault;

  const is2PlayerRef = useRef<boolean>(is2Player);
  is2PlayerRef.current = is2Player;

  const matchStageRef = useRef<MatchStage>(matchStage);
  matchStageRef.current = matchStage;

  const scoreRef = useRef<MatchScore>(score);
  scoreRef.current = score;

  const timeRemainingRef = useRef<number>(timeRemaining);
  timeRemainingRef.current = timeRemaining;

  const countdownNumberRef = useRef<number | null>(countdownNumber);
  countdownNumberRef.current = countdownNumber;

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Network rate-limiting refs to eliminate multiplayer lag & buffer bloat
  const lastSyncTimeRef = useRef<number>(0);
  const lastInputSentRef = useRef<number>(0);

  const p1ChargeTimeRef = useRef<number>(0);
  const p1ChargingRef = useRef<boolean>(false);
  const lastChargeHumRef = useRef<number>(0);

  const p2ChargeTimeRef = useRef<number>(0);
  const p2ChargingRef = useRef<boolean>(false);

  const pendingShootP1Ref = useRef<boolean>(false);
  const pendingShootP2Ref = useRef<boolean>(false);

  const botChargeTimeRef = useRef<number>(0);
  const botChargingRef = useRef<boolean>(false);

  const koCountdownTimerRef = useRef<number | null>(null);
  const koDangerSideRef = useRef<'team1' | 'team2' | null>(null);
  const lastKOBleepRef = useRef<number>(-1);

  // 10-Second Clock Countdown Tick Sound Ref
  const lastClockTickRef = useRef<number>(-1);

  const handleSelectBotSpeed = useCallback((speed: number) => {
    setBotSpeedMultiplier(speed);
    botSpeedMultiplierRef.current = speed;
    const updated: PlayerProfile = { ...profile, botSpeedMultiplier: speed };
    onUpdateProfile(updated);
    storage.saveProfile(updated);
    sound.playBooster();
    setJudgeCommentary(`"Screen #${stationIndex}: AI Bot speed set to ${speed === 100 ? '⚡ 100X GOD SPEED' : speed === 2 ? '2X BALANCED (RECOMMENDED)' : `${speed}X`}! Prepare for extreme maneuvers!"`);
  }, [profile, onUpdateProfile, stationIndex]);

  // Snappy 3 2 1 GO countdown
  const proceedToCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setMatchStage('COUNTDOWN');
    matchStageRef.current = 'COUNTDOWN';
    setJudgeMood('COUNTDOWN');
    setJudgeCommentary(`"Screen #${stationIndex}: 3, 2, 1, BRAWL!"`);
    setCountdownNumber(3);
    countdownNumberRef.current = 3;
    sound.playCountdown(false);

    if (isOnlineModeRef.current && isOnlineHostRef.current) {
      onlineService.sendMessage({
        type: 'COUNTDOWN_STEP',
        payload: { step: 3 },
      });
    }

    let step = 3;
    countdownIntervalRef.current = setInterval(() => {
      step -= 1;
      if (step > 0) {
        setCountdownNumber(step);
        countdownNumberRef.current = step;
        sound.playCountdown(false);
        if (isOnlineModeRef.current && isOnlineHostRef.current) {
          onlineService.sendMessage({
            type: 'COUNTDOWN_STEP',
            payload: { step },
          });
        }
      } else if (step === 0) {
        setCountdownNumber(0);
        countdownNumberRef.current = 0;
        sound.playCountdown(true);
        sound.playWhistle();
        setJudgeMood('WHISTLE');
        setJudgeCommentary(`"TWEET! Screen #${stationIndex} LIVE! Grab Key 🔑, secure Purple Balls 🟣 in Vault!"`);
        if (isOnlineModeRef.current && isOnlineHostRef.current) {
          onlineService.sendMessage({
            type: 'COUNTDOWN_STEP',
            payload: { step: 0 },
          });
        }
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdownNumber(null);
        countdownNumberRef.current = null;
        setMatchStage('PLAYING');
        matchStageRef.current = 'PLAYING';
        setJudgeMood('CHEERING');
        sound.startMusic();
        if (isOnlineModeRef.current && isOnlineHostRef.current) {
          onlineService.sendMessage({
            type: 'COUNTDOWN_STEP',
            payload: { step: -1 },
          });
        }
      }
    }, 850);
  }, [stationIndex]);

  const handleSkipCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownNumber(null);
    countdownNumberRef.current = null;
    setMatchStage('PLAYING');
    matchStageRef.current = 'PLAYING';
    setJudgeMood('CHEERING');
    sound.playWhistle();
    sound.startMusic();
    if (isOnlineModeRef.current && isOnlineHostRef.current) {
      onlineService.sendMessage({
        type: 'COUNTDOWN_STEP',
        payload: { step: -1 },
      });
    }
  }, []);

  // Start / Restart match flow
  const startMatchFlow = useCallback((_force2Player?: boolean, customDuration?: number) => {
    // Local play is ALWAYS solo vs AI bot! Only online multiplayer has a human opponent.
    const isOnline = isOnlineModeRef.current;
    setIs2Player(isOnline);
    is2PlayerRef.current = isOnline;

    const duration = customDuration ? customDuration : +(30 + Math.random() * 30).toFixed(1);
    setRandomRoundDuration(duration);
    setTimeRemaining(duration);
    timeRemainingRef.current = duration;

    // Reset KO countdown and charging states
    koCountdownTimerRef.current = null;
    koDangerSideRef.current = null;
    lastKOBleepRef.current = -1;
    setKoState(null);
    lastClockTickRef.current = -1;

    p1ChargingRef.current = false;
    p1ChargeTimeRef.current = 0;
    setP1ChargeTime(0);

    p2ChargingRef.current = false;
    p2ChargeTimeRef.current = 0;
    setP2ChargeTime(0);

    botChargingRef.current = false;
    botChargeTimeRef.current = 0;
    setBotChargeTime(0);

    // Reset initial balls & robots (Exactly 1 Purple Ball per side, total 2 purple balls!)
    const freshBalls = createCourtBalls();
    setBalls(freshBalls);
    ballsRef.current = freshBalls;

    const r1 = {
      ...INITIAL_ROBOT_1,
      name: profile.name || profile.robot.name,
      color: profile.color,
      heldBalls: [],
      hasKey: false,
    };
    const r2 = {
      ...INITIAL_ROBOT_2,
      name: currentOpponent.name,
      heldBalls: [],
      hasKey: false,
    };
    robot1Ref.current = r1;
    robot2Ref.current = r2;
    setRobot1(r1);
    setRobot2(r2);

    const v1: VaultBox = { team: 'team1', x: 12, y: 18, isSecured: false, securedCount: 0, maxCapacity: 1 };
    const v2: VaultBox = { team: 'team2', x: 88, y: 18, isSecured: false, securedCount: 0, maxCapacity: 1 };
    team1VaultRef.current = v1;
    team2VaultRef.current = v2;
    setTeam1Vault(v1);
    setTeam2Vault(v2);

    const k1: KeyItem = { id: `key1_${stationIndex}`, team: 'team1', x: 18, y: 76, isCollected: false, carriedBy: 'none' };
    const k2: KeyItem = { id: `key2_${stationIndex}`, team: 'team2', x: 82, y: 76, isCollected: false, carriedBy: 'none' };
    team1KeyRef.current = k1;
    team2KeyRef.current = k2;
    setTeam1Key(k1);
    setTeam2Key(k2);

    setScore({
      team1Orange: 4,
      team1Purple: 1,
      team1Marks: 2,
      team1VaultSecured: false,
      team1VaultSecuredCount: 0,
      team2Orange: 4,
      team2Purple: 1,
      team2Marks: 2,
      team2VaultSecured: false,
      team2VaultSecuredCount: 0,
      team1Shots: 0,
      team2Shots: 0,
      randomRoundDuration: duration,
      winner: null,
      isKO: false,
      koWinner: null,
    });

    if (isOnlineModeRef.current && isOnlineHostRef.current) {
      onlineService.sendMessage({
        type: 'START_MATCH',
        payload: {
          duration,
          balls: freshBalls,
          robot1: r1,
          robot2: r2,
          vault1: v1,
          vault2: v2,
          key1: k1,
          key2: k2,
        },
      });
    }

    proceedToCountdown();
  }, [profile, currentOpponent.name, stationIndex, proceedToCountdown]);

  // Player 1 Movement (Only local player or online host controls Robot 1)
  const handleMoveP1 = useCallback((dx: number, dy: number) => {
    if (matchStageRef.current !== 'PLAYING') return;
    // An online guest CANNOT control Robot 1 (opponent)
    if (isOnlineModeRef.current && !isOnlineHostRef.current) return;

    setRobot1((prev) => {
      const mag = Math.hypot(dx, dy);
      if (mag === 0) return prev;

      const normX = dx / mag;
      const normY = dy / mag;
      const speed = (1.4 + profile.robot.motorLevel * 0.15) * Math.min(1.2, mag);

      const nextX = Math.min(46, Math.max(7, prev.x + normX * speed));
      const nextY = Math.min(86, Math.max(14, prev.y + normY * speed));

      const targetAngle = (Math.atan2(normY, normX) * 180) / Math.PI;
      let diff = (targetAngle - prev.angle) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;
      const angle = prev.angle + diff * 0.35;

      const updated = {
        ...prev,
        x: nextX,
        y: nextY,
        angle,
      };
      robot1Ref.current = updated;
      return updated;
    });
  }, [profile.robot.motorLevel]);

  // Player 2 Movement (Only remote online guest controls Robot 2; local player NEVER controls Robot 2)
  const handleMoveP2 = useCallback((dx: number, dy: number) => {
    if (matchStageRef.current !== 'PLAYING') return;
    // Host / local player CANNOT control Robot 2 (opponent)
    if (!isOnlineModeRef.current || isOnlineHostRef.current) return;

    setRobot2((prev) => {
      const mag = Math.hypot(dx, dy);
      if (mag === 0) return prev;

      const normX = dx / mag;
      const normY = dy / mag;
      const speed = 1.4 * Math.min(1.2, mag);

      const nextX = Math.min(93, Math.max(54, prev.x + normX * speed));
      const nextY = Math.min(86, Math.max(14, prev.y + normY * speed));

      const targetAngle = (Math.atan2(normY, normX) * 180) / Math.PI;
      let diff = (targetAngle - prev.angle) % 360;
      if (diff < -180) diff += 360;
      if (diff > 180) diff -= 360;
      const angle = prev.angle + diff * 0.35;

      const updated = {
        ...prev,
        x: nextX,
        y: nextY,
        angle,
      };
      robot2Ref.current = updated;

      // When guest in online match, transmit position to host (throttled to ~25 Hz to eliminate lag and network bloat)
      const now = performance.now();
      if (now - lastInputSentRef.current >= 40) {
        lastInputSentRef.current = now;
        onlineService.sendMessage({
          type: 'INPUT_P2',
          payload: { x: +nextX.toFixed(1), y: +nextY.toFixed(1), angle: Math.round(angle) },
        });
      }

      return updated;
    });
  }, []);

  // Shoot P1 (Only local player or online host can shoot Robot 1)
  const handleShootP1 = useCallback(() => {
    if (matchStageRef.current !== 'PLAYING') return;
    // An online guest CANNOT shoot Robot 1 (opponent)
    if (isOnlineModeRef.current && !isOnlineHostRef.current) return;

    const r1 = robot1Ref.current;
    if (r1.heldBalls.length === 0) return;

    pendingShootP1Ref.current = true;
  }, []);

  // Shoot P2 (Only remote online guest can shoot Robot 2)
  const handleShootP2 = useCallback(() => {
    if (matchStageRef.current !== 'PLAYING') return;
    // In local solo play or as host, the player CANNOT shoot Robot 2 (opponent)
    if (!isOnlineModeRef.current) return;

    // When guest in online match, trigger local sound and instruct host to shoot
    if (!isOnlineHostRef.current) {
      sound.playShoot();
      onlineService.sendMessage({ type: 'SHOOT_P2' });
      return;
    }

    const r2 = robot2Ref.current;
    if (r2.heldBalls.length === 0) return;

    pendingShootP2Ref.current = true;
  }, []);

  // Finalize Round & Auto-Save Progress to Player Profile
  const finalizeRound = useCallback(() => {
    // If round already ended via KO, do not overwrite KO scores
    if (scoreRef.current.isKO) return;

    setMatchStage('ROUND_OVER');
    matchStageRef.current = 'ROUND_OVER';
    sound.stopMusic();
    sound.playWhistle(true);

    const t1Marks = score.team1Marks;
    const t2Marks = score.team2Marks;
    const isP1Win = t1Marks < t2Marks;
    const isDraw = t1Marks === t2Marks;

    const tokensEarned = isP1Win ? 250 : isDraw ? 100 : 50;
    const p1VaultSaved = team1VaultRef.current.securedCount || 0;

    let tournamentWinBonus = 0;
    let nextTournamentProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
    let tournamentResultData: any = null;

    if (!is2PlayerRef.current && !isOnlineModeRef.current) {
      if (isP1Win) {
        const curProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
        const tResult = tournamentService.recordWin(curProgress);
        nextTournamentProgress = tResult.updatedProgress;
        tournamentWinBonus = tResult.rewardTokens;

        const winsInStage = tournamentService.getWinsForStage(tResult.updatedProgress, tResult.clearedStageNumber);
        const reqInStage = tournamentService.getRequiredWinsForStage(tResult.clearedStageNumber);

        tournamentResultData = {
          stage: tResult.clearedStageNumber,
          matchNumber: winsInStage,
          requiredWins: reqInStage,
          isGrandFinals: tResult.clearedStageNumber === 3,
          isChampion: tResult.becameChampion,
          stageCleared: tResult.stageCleared,
          isP1Win: true,
        };
        setLastTournamentResult(tournamentResultData);

        if (tResult.becameChampion) {
          sound.playGrandVictoryFanfare();
          onTournamentWin?.({ stageCleared: true, becameChampion: true });
        } else if (tResult.stageCleared) {
          sound.playStadiumHorn();
          onTournamentWin?.({ stageCleared: true, becameChampion: false });
        }
      } else {
        const curProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
        const winsInStage = tournamentService.getWinsForStage(curProgress, curProgress.currentStage);
        const reqInStage = tournamentService.getRequiredWinsForStage(curProgress.currentStage);
        tournamentResultData = {
          stage: curProgress.currentStage,
          matchNumber: winsInStage,
          requiredWins: reqInStage,
          isGrandFinals: curProgress.currentStage === 3,
          isChampion: false,
          stageCleared: false,
          isP1Win: false,
        };
        setLastTournamentResult(tournamentResultData);
      }
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      tokens: profile.tokens + tokensEarned + tournamentWinBonus,
      tournamentProgress: nextTournamentProgress,
      stats: {
        ...profile.stats,
        matchesPlayed: profile.stats.matchesPlayed + 1,
        wins: profile.stats.wins + (isP1Win ? 1 : 0),
        losses: profile.stats.losses + (!isP1Win && !isDraw ? 1 : 0),
        draws: profile.stats.draws + (isDraw ? 1 : 0),
        purpleBallsSecuredTotal: profile.stats.purpleBallsSecuredTotal + p1VaultSaved,
        maxLockdowns: profile.stats.maxLockdowns + (p1VaultSaved >= 2 ? 1 : 0),
      },
      lastSavedAt: new Date().toISOString(),
    };

    onUpdateProfile(updatedProfile);
    storage.saveProfile(updatedProfile);

    if (tournamentResultData?.isChampion) {
      setJudgeMood('VICTORY');
      setJudgeCommentary(
        `"🏆 WORLD CHAMPION! ${profile.name} DEFEATED TEAM TAIWAN! YOU ARE THE 2026 DOUBLE TENNIS CHAMPION!"`
      );
    } else if (tournamentResultData?.stageCleared) {
      setJudgeMood('VICTORY');
      setJudgeCommentary(
        `"🌟 STAGE ${tournamentResultData.stage} CLEARED! 5 bot matches won! Advancing to ${tournamentResultData.stage === 2 ? 'the Grand Finals against Team Taiwan' : 'Stage 2 where bots get stronger'}!"`
      );
    } else if (isP1Win) {
      setJudgeMood('VICTORY');
      setJudgeCommentary(
        tournamentResultData
          ? `"MATCH OVER! ${profile.name} WINS Match ${tournamentResultData.matchNumber}/${tournamentResultData.requiredWins}! (+${tokensEarned + tournamentWinBonus} PTS). Less marks wins!"`
          : `"MATCH OVER! ${profile.name} WINS! (+${tokensEarned} PTS). Less marks wins!"`
      );
    } else if (isDraw) {
      setJudgeMood('READY');
      setJudgeCommentary(`"TIE MATCH! Dead heat marks on Screen #${stationIndex}!"`);
    } else {
      setJudgeMood('PENALTY');
      setJudgeCommentary(
        tournamentResultData?.isGrandFinals
          ? `"MATCH OVER! Team Taiwan defended their court! Rematch ready to take the Championship!"`
          : `"MATCH OVER! ${currentOpponent.name} claims victory! Practice ramp clearing and try again!"`
      );
    }
  }, [score, profile, stationIndex, currentOpponent.name, onUpdateProfile, onTournamentWin]);

  // 10-Second Knockout (KO) Finalizer
  // When all 8 orange balls stay on one side for 10s, the other side wins (-4 to 9 marks)!
  // "remember the less markd the bigger victory"
  const finalizeKO = useCallback((winner: 'team1' | 'team2') => {
    setMatchStage('ROUND_OVER');
    matchStageRef.current = 'ROUND_OVER';
    sound.stopMusic();
    sound.playKOBuzzer();
    sound.playWhistle(true);

    const isP1Win = winner === 'team1';
    // Winner gets -4 marks, Loser gets 9 marks (less marks = bigger victory!)
    const t1Marks = isP1Win ? -4 : 9;
    const t2Marks = isP1Win ? 9 : -4;

    const koScore: MatchScore = {
      ...scoreRef.current,
      team1Marks: t1Marks,
      team2Marks: t2Marks,
      team1Orange: isP1Win ? 0 : 8,
      team2Orange: isP1Win ? 8 : 0,
      winner,
      isKO: true,
      koWinner: winner,
    };
    scoreRef.current = koScore;
    setScore(koScore);

    // Stop and clear KO timers
    koCountdownTimerRef.current = null;
    koDangerSideRef.current = null;
    lastKOBleepRef.current = -1;
    setKoState(null);

    const tokensEarned = isP1Win ? 350 : 50;
    const p1VaultSaved = team1VaultRef.current.securedCount || 0;

    let tournamentWinBonus = 0;
    let nextTournamentProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
    let tournamentResultData: any = null;

    if (!is2PlayerRef.current && !isOnlineModeRef.current) {
      if (isP1Win) {
        const curProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
        const tResult = tournamentService.recordWin(curProgress);
        nextTournamentProgress = tResult.updatedProgress;
        tournamentWinBonus = tResult.rewardTokens;

        const winsInStage = tournamentService.getWinsForStage(tResult.updatedProgress, tResult.clearedStageNumber);
        const reqInStage = tournamentService.getRequiredWinsForStage(tResult.clearedStageNumber);

        tournamentResultData = {
          stage: tResult.clearedStageNumber,
          matchNumber: winsInStage,
          requiredWins: reqInStage,
          isGrandFinals: tResult.clearedStageNumber === 3,
          isChampion: tResult.becameChampion,
          stageCleared: tResult.stageCleared,
          isP1Win: true,
        };
        setLastTournamentResult(tournamentResultData);

        if (tResult.becameChampion) {
          sound.playGrandVictoryFanfare();
          onTournamentWin?.({ stageCleared: true, becameChampion: true });
        } else if (tResult.stageCleared) {
          sound.playStadiumHorn();
          onTournamentWin?.({ stageCleared: true, becameChampion: false });
        }
      } else {
        const curProgress = profile.tournamentProgress || tournamentService.getDefaultProgress();
        const winsInStage = tournamentService.getWinsForStage(curProgress, curProgress.currentStage);
        const reqInStage = tournamentService.getRequiredWinsForStage(curProgress.currentStage);
        tournamentResultData = {
          stage: curProgress.currentStage,
          matchNumber: winsInStage,
          requiredWins: reqInStage,
          isGrandFinals: curProgress.currentStage === 3,
          isChampion: false,
          stageCleared: false,
          isP1Win: false,
        };
        setLastTournamentResult(tournamentResultData);
      }
    }

    const updatedProfile: PlayerProfile = {
      ...profile,
      tokens: profile.tokens + tokensEarned + tournamentWinBonus,
      tournamentProgress: nextTournamentProgress,
      stats: {
        ...profile.stats,
        matchesPlayed: profile.stats.matchesPlayed + 1,
        wins: profile.stats.wins + (isP1Win ? 1 : 0),
        losses: profile.stats.losses + (!isP1Win ? 1 : 0),
        purpleBallsSecuredTotal: profile.stats.purpleBallsSecuredTotal + p1VaultSaved,
        maxLockdowns: profile.stats.maxLockdowns + (p1VaultSaved >= 2 ? 1 : 0),
      },
      lastSavedAt: new Date().toISOString(),
    };

    onUpdateProfile(updatedProfile);
    storage.saveProfile(updatedProfile);

    const winnerName = isP1Win ? profile.name : is2PlayerRef.current ? player2Name : currentOpponent.name;
    const loserName = !isP1Win ? profile.name : is2PlayerRef.current ? player2Name : currentOpponent.name;

    setJudgeMood('VICTORY');
    setJudgeCommentary(
      tournamentResultData?.isChampion
        ? `"💥 KNOCKOUT (KO) CHAMPION! ${winnerName} CRUSHED TEAM TAIWAN! YOU ARE THE WORLD CHAMPION!"`
        : `"💥 KNOCKOUT (KO)! ${winnerName} WINS WITH -4 MARKS vs ${loserName}'s 9 MARKS! The less marks, the bigger victory!"`
    );

    if (isOnlineModeRef.current && isOnlineHostRef.current) {
      onlineService.sendMessage({
        type: 'SYNC_STATE',
        payload: {
          score: koScore,
          matchStage: 'ROUND_OVER',
          koState: null,
          timeRemaining: 0,
        },
      });
    }
  }, [profile, player2Name, currentOpponent.name, onUpdateProfile, onTournamentWin]);

  // 1-SECOND CHARGING SYSTEM FOR PLAYER 1 (ME / HOST)
  // Must hold space for 1 second before shooting!
  const handleStartChargeP1 = useCallback(() => {
    if (matchStageRef.current !== 'PLAYING') return;
    if (isOnlineModeRef.current && !isOnlineHostRef.current) return;
    if (robot1Ref.current.heldBalls.length === 0) return;
    p1ChargingRef.current = true;
  }, []);

  const handleCancelChargeP1 = useCallback(() => {
    // If charged for >= 0.95s OR if released quickly as a tap (< 0.3s), trigger the shot!
    if (p1ChargeTimeRef.current >= 0.95 || p1ChargeTimeRef.current < 0.3) {
      pendingShootP1Ref.current = true;
    }
    p1ChargingRef.current = false;
    p1ChargeTimeRef.current = 0;
    setP1ChargeTime(0);
  }, []);

  // 1-SECOND CHARGING SYSTEM FOR PLAYER 2 (ONLINE GUEST)
  // Guest can also tap or hold 1 second to shoot
  const handleStartChargeP2 = useCallback(() => {
    if (matchStageRef.current !== 'PLAYING') return;
    if (!isOnlineModeRef.current || isOnlineHostRef.current) return;
    if (robot2Ref.current.heldBalls.length === 0) return;
    p2ChargingRef.current = true;
    onlineService.sendMessage({ type: 'CHARGE_P2' });
  }, []);

  const handleCancelChargeP2 = useCallback(() => {
    if (p2ChargeTimeRef.current >= 0.95 || p2ChargeTimeRef.current < 0.3) {
      if (isOnlineModeRef.current && !isOnlineHostRef.current) {
        handleShootP2();
      } else {
        pendingShootP2Ref.current = true;
      }
    }
    p2ChargingRef.current = false;
    p2ChargeTimeRef.current = 0;
    setP2ChargeTime(0);
    if (isOnlineModeRef.current && !isOnlineHostRef.current) {
      onlineService.sendMessage({ type: 'CHARGE_CANCEL_P2' });
    }
  }, [handleShootP2]);

  useEffect(() => {
    if (forceOpenInviteModal) {
      setIsInviteModalOpen(true);
    }
  }, [forceOpenInviteModal]);

  useEffect(() => {
    if (initialRoomCode) {
      setIsInviteModalOpen(true);
    }
  }, [initialRoomCode]);

  // Initial countdown trigger on load
  useEffect(() => {
    if (!initialRoomCode && !isOnlineModeRef.current) {
      proceedToCountdown();
    }
  }, [initialRoomCode, proceedToCountdown]);

  // Round Timer countdown
  useEffect(() => {
    if (matchStage !== 'PLAYING') {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
      return;
    }

    matchTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = +(prev - 0.1).toFixed(1);
        // 10-second countdown with sound
        if (next <= 10.0 && next > 0) {
          const sec = Math.ceil(next);
          if (sec !== lastClockTickRef.current && sec >= 1 && sec <= 10) {
            lastClockTickRef.current = sec;
            sound.playClockTick(sec);
          }
        }
        if (next <= 0) {
          clearInterval(matchTimerRef.current as NodeJS.Timeout);
          finalizeRound();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (matchTimerRef.current) clearInterval(matchTimerRef.current);
    };
  }, [matchStage, finalizeRound]);

  // Continuous 60 FPS Physics & AI Bot Loop
  useEffect(() => {
    if (matchStage !== 'PLAYING' && matchStage !== 'ROUND_OVER') return;

    let lastTime = performance.now();
    let botShootCooldown = 0;

    const loop = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // 1. BALL PHYSICS & AUTHORITATIVE LOOP (Host runs authoritative physics, or local game)
      if (!isOnlineModeRef.current || isOnlineHostRef.current) {
        const r1 = robot1Ref.current;
        const r2 = robot2Ref.current;
        const currentBalls = ballsRef.current;
        const mult = botSpeedMultiplierRef.current || 100;

        // A. Ball physics update
        const updatedBalls = currentBalls.map((b) => {
          if (b.isCarriedBy !== 'none' || b.isSecuredInVault) return b;

          let nextX = b.x + b.vx * dt;
          let nextY = b.y + b.vy * dt;
          let nextVx = b.vx;
          let nextVy = b.vy;
          let inAir = b.inAir;
          let airTime = b.airTime !== undefined ? b.airTime - dt : undefined;

          // Flight landing: inAir balls fly cleanly over the ramp into opponent's court
          if (inAir) {
            // Team 1 shoots right (vx > 0) -> lands cleanly on Team 2 court (nextX >= 62)
            // Team 2 shoots left (vx < 0) -> lands cleanly on Team 1 court (nextX <= 38)
            const clearedCourt = (b.vx > 0 && nextX >= 62) || (b.vx < 0 && nextX <= 38);
            const outsideRampZone = nextX < 41 || nextX > 59;
            const flightTimedOut = airTime !== undefined && airTime <= 0;

            if (clearedCourt || (flightTimedOut && outsideRampZone)) {
              inAir = false;
              airTime = undefined;
              sound.playBounce();
            }
          }

          // RAMP SLOPE DYNAMICS (Anti-Stuck Center Ramp Physics)
          // The ramp slope is between x = 41 and x = 59 with apex ridge at x = 50.
          // Note: Ramp slope gravity ONLY applies to grounded balls (!inAir) so shots smoothly clear the ramp!
          const onRamp = !inAir && nextX >= 41 && nextX <= 59;
          if (onRamp) {
            if (nextX < 49.5) {
              // Left slope (x < 50):
              // If moving forward up the slope (nextVx > 0), gentle resistance so balls with momentum can crest it
              if (nextVx > 0) {
                nextVx -= 16 * dt;
                if (nextVx < 0.5) nextVx = -2.0;
              } else {
                // Rolling downhill to the left into Team 1 court
                nextVx = Math.max(-14.0, nextVx - 18 * dt);
              }
            } else if (nextX > 50.5) {
              // Right slope (x > 50):
              // If moving forward up the slope to the left (nextVx < 0), gentle resistance
              if (nextVx < 0) {
                nextVx += 16 * dt;
                if (nextVx > -0.5) nextVx = 2.0;
              } else {
                // Rolling downhill to the right into Team 2 court
                nextVx = Math.min(14.0, nextVx + 18 * dt);
              }
            } else {
              // Apex ridge knife-edge (x ≈ 50): tip down whichever direction it was heading!
              const rollDir = nextVx >= 0 ? 1 : -1;
              nextVx = rollDir * 8.0;
              nextX += rollDir * 0.5;
            }

            // Anti-stuck watchdog: ONLY gently nudge if truly stationary (Math.abs < 0.3)
            if (Math.abs(nextVx) < 0.3) {
              nextVx = nextX < 50 ? -6.0 : 6.0;
            }
          }

          // Wall boundaries
          if (nextX <= 6) {
            nextX = 6;
            nextVx = Math.abs(nextVx) * 0.5;
          } else if (nextX >= 94) {
            nextX = 94;
            nextVx = -Math.abs(nextVx) * 0.5;
          }

          if (nextY <= 12) {
            nextY = 12;
            nextVy = Math.abs(nextVy) * 0.6;
          } else if (nextY >= 88) {
            nextY = 88;
            nextVy = -Math.abs(nextVy) * 0.6;
          }

          // Friction
          if (!onRamp) {
            const friction = inAir ? 0.985 : 0.92;
            nextVx *= friction;
            nextVy *= friction;
            if (Math.abs(nextVx) < 0.25) nextVx = 0;
            if (Math.abs(nextVy) < 0.25) nextVy = 0;
          } else {
            // On ramp: low X friction so slope gravity rolls ball completely off into court
            nextVy *= 0.92;
          }

          return {
            ...b,
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy,
            side: (nextX < 50 ? 'left' : 'right') as 'left' | 'right',
            inAir,
            airTime,
          };
        });

        // B. Key and Vault Interactions for Robot 1 (Team 1)
        const curKey1 = team1KeyRef.current;
        const curVault1 = team1VaultRef.current;
        if (!curKey1.isCollected && !r1.hasKey) {
          if (Math.hypot(curKey1.x - r1.x, curKey1.y - r1.y) < 7.5) {
            r1.hasKey = true;
            const updatedK1: KeyItem = { ...curKey1, isCollected: true, carriedBy: 'p1' };
            team1KeyRef.current = updatedK1;
            setTeam1Key(updatedK1);
            sound.playKeyPickup();
            setJudgeCommentary(`"Screen #${stationIndex}: Team 1 got Golden Key 🔑! Bring Purple Balls 🟣 to Vault!"`);
          }
        }
        if (r1.hasKey && curVault1.securedCount === 0) {
          const pIdx = r1.heldBalls.findIndex((b) => b.type === 'purple');
          if (pIdx !== -1 && Math.hypot(curVault1.x - r1.x, curVault1.y - r1.y) < 8.5) {
            const purpleItem = r1.heldBalls[pIdx];
            r1.heldBalls.splice(pIdx, 1);
            const updatedV1: VaultBox = { ...curVault1, isSecured: true, securedCount: 1 };
            team1VaultRef.current = updatedV1;
            setTeam1Vault(updatedV1);
            sound.playLock();
            const bIndex = updatedBalls.findIndex((b) => b.id === purpleItem.id);
            if (bIndex !== -1) {
              updatedBalls[bIndex] = {
                ...updatedBalls[bIndex],
                isSecuredInVault: true,
                isCarriedBy: 'none' as const,
                x: curVault1.x,
                y: curVault1.y,
              };
            }
            setScore((s) => ({ ...s, team1VaultSecured: true, team1VaultSecuredCount: 1 }));
            setJudgeCommentary(`"VAULT LOCKED! Screen #${stationIndex} Team 1 locked purple ball #1 (-2 marks)!"`);
          }
        }
        // Ball pickup for Robot 1 (Cannot pick up balls sailing in air!)
        if (r1.heldBalls.length < r1.maxCapacity) {
          const reach = r1.x >= 40 ? 11.0 : 7.0;
          for (let i = 0; i < updatedBalls.length; i++) {
            const b = updatedBalls[i];
            if (b.isCarriedBy === 'none' && !b.inAir && !b.isSecuredInVault && b.x <= 54) {
              if (Math.hypot(b.x - r1.x, b.y - r1.y) < reach) {
                b.isCarriedBy = 'p1' as const;
                r1.heldBalls.push({ id: b.id, type: b.type });
                sound.playPickup(b.type === 'purple');
                break;
              }
            }
          }
        }

        // C. Interactions for Robot 2 (Online Guest or Local 2P)
        if (is2PlayerRef.current) {
          const curKey2 = team2KeyRef.current;
          const curVault2 = team2VaultRef.current;
          if (!curKey2.isCollected && !r2.hasKey) {
            if (Math.hypot(curKey2.x - r2.x, curKey2.y - r2.y) < 7.5) {
              r2.hasKey = true;
              const updatedK2: KeyItem = { ...curKey2, isCollected: true, carriedBy: 'p2' };
              team2KeyRef.current = updatedK2;
              setTeam2Key(updatedK2);
              sound.playKeyPickup();
              setJudgeCommentary(`"Team 2 secured the Golden Key 🔑! Bring Purple Ball 🟣 to Vault!"`);
            }
          }
          if (r2.hasKey && curVault2.securedCount === 0) {
            const pIdx = r2.heldBalls.findIndex((b) => b.type === 'purple');
            if (pIdx !== -1 && Math.hypot(curVault2.x - r2.x, curVault2.y - r2.y) < 8.5) {
              const purpleItem = r2.heldBalls[pIdx];
              r2.heldBalls.splice(pIdx, 1);
              const updatedV2: VaultBox = { ...curVault2, isSecured: true, securedCount: 1 };
              team2VaultRef.current = updatedV2;
              setTeam2Vault(updatedV2);
              sound.playLock();
              const bIndex = updatedBalls.findIndex((b) => b.id === purpleItem.id);
              if (bIndex !== -1) {
                updatedBalls[bIndex] = {
                  ...updatedBalls[bIndex],
                  isSecuredInVault: true,
                  isCarriedBy: 'none' as const,
                  x: curVault2.x,
                  y: curVault2.y,
                };
              }
              setScore((s) => ({ ...s, team2VaultSecured: true, team2VaultSecuredCount: 1 }));
            }
          }
          // Ball pickup for Robot 2
          if (r2.heldBalls.length < r2.maxCapacity) {
            const reach = r2.x <= 60 ? 11.0 : 7.0;
            for (let i = 0; i < updatedBalls.length; i++) {
              const b = updatedBalls[i];
              if (b.isCarriedBy === 'none' && !b.inAir && !b.isSecuredInVault && b.x >= 46) {
                if (Math.hypot(b.x - r2.x, b.y - r2.y) < reach) {
                  b.isCarriedBy = 'p2' as const;
                  r2.heldBalls.push({ id: b.id, type: b.type });
                  sound.playPickup(b.type === 'purple');
                  break;
                }
              }
            }
          }
        }

        // D. ULTRA-SMOOTH AI BOT (Single Player mode)
        if (!is2PlayerRef.current && matchStageRef.current === 'PLAYING') {
          botShootCooldown = Math.max(0, botShootCooldown - dt * 1000);
          const currentKey = team2KeyRef.current;
          const currentVault = team2VaultRef.current;
          const botVaultLockedCount = currentVault.securedCount || 0;

          const totalInHopper = r2.heldBalls.length;
          const hasPurpleInHopper = r2.heldBalls.some((b) => b.type === 'purple');
          const rightBalls = updatedBalls.filter(
            (b) => b.isCarriedBy === 'none' && !b.inAir && !b.isSecuredInVault && b.x >= 48
          );
          const rightOrangeBalls = rightBalls.filter((b) => b.type === 'orange');
          const rightPurpleBalls = rightBalls.filter((b) => b.type === 'purple');

          let targetX = 75;
          let targetY = 50;
          let isShootingRun = false;

          if (!currentKey.isCollected && !r2.hasKey) {
            targetX = currentKey.x;
            targetY = currentKey.y;
          } else if (r2.hasKey && hasPurpleInHopper && botVaultLockedCount === 0) {
            targetX = currentVault.x;
            targetY = currentVault.y;
          } else if (r2.hasKey && botVaultLockedCount === 0 && rightPurpleBalls.length > 0 && totalInHopper < r2.maxCapacity) {
            targetX = rightPurpleBalls[0].x;
            targetY = rightPurpleBalls[0].y;
          } else if (totalInHopper > 0 && !(r2.hasKey && hasPurpleInHopper && botVaultLockedCount === 0)) {
            isShootingRun = true;
            targetX = 56;
            targetY = 24 + Math.sin(currentTime * 0.003) * 32;
          } else if (rightOrangeBalls.length > 0 && totalInHopper < r2.maxCapacity) {
            const closest = rightOrangeBalls.reduce((best, curr) => {
              const dCurr = Math.hypot(curr.x - r2.x, curr.y - r2.y);
              const dBest = Math.hypot(best.x - r2.x, best.y - r2.y);
              return dCurr < dBest ? curr : best;
            }, rightOrangeBalls[0]);
            targetX = closest.x;
            targetY = closest.y;
          } else {
            const patrolNodes = [
              { x: 58, y: 26 },
              { x: 88, y: 22 },
              { x: 74, y: 50 },
              { x: 88, y: 78 },
              { x: 58, y: 74 },
            ];
            const nodeIdx = Math.floor(currentTime / 800) % patrolNodes.length;
            targetX = patrolNodes[nodeIdx].x;
            targetY = patrolNodes[nodeIdx].y;
          }

          const dx = targetX - r2.x;
          const dy = targetY - r2.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.2) {
            let speedScale = 1.15;
            if (mult === 1) speedScale = 0.75;
            else if (mult === 2) speedScale = 1.15;
            else if (mult === 4) speedScale = 2.0;
            else if (mult >= 100) speedScale = 16.0;

            const baseSpeed = (currentOpponent.speed || 1.8) * 14.0 * speedScale;
            const currentSpeed = mult >= 100 ? Math.max(baseSpeed, dist * 35.0) : Math.min(baseSpeed, dist * 4.0 + 7.5);
            const step = Math.min(dist, currentSpeed * dt);

            const nextX = Math.min(93, Math.max(53, r2.x + (dx / dist) * step));
            const nextY = Math.min(87, Math.max(13, r2.y + (dy / dist) * step));

            const targetAngle = isShootingRun ? 180 : (Math.atan2(dy, dx) * 180) / Math.PI;
            let diff = (targetAngle - r2.angle) % 360;
            if (diff < -180) diff += 360;
            if (diff > 180) diff -= 360;
            const angle = r2.angle + diff * 0.45;

            r2.x = nextX;
            r2.y = nextY;
            r2.angle = angle;

            // Key pickup by bot
            if (!currentKey.isCollected && !r2.hasKey) {
              if (Math.hypot(currentKey.x - nextX, currentKey.y - nextY) < 7.5) {
                r2.hasKey = true;
                const updatedK = { ...currentKey, isCollected: true, carriedBy: 'p2' as const };
                team2KeyRef.current = updatedK;
                setTeam2Key(updatedK);
                sound.playKeyPickup();
              }
            }

            // Vault deposit by bot
            if (r2.hasKey && botVaultLockedCount === 0) {
              const pIdx = r2.heldBalls.findIndex((b) => b.type === 'purple');
              if (pIdx !== -1 && Math.hypot(currentVault.x - nextX, currentVault.y - nextY) < 8.5) {
                const purpleItem = r2.heldBalls[pIdx];
                r2.heldBalls.splice(pIdx, 1);
                const updatedV = { ...currentVault, isSecured: true, securedCount: 1 };
                team2VaultRef.current = updatedV;
                setTeam2Vault(updatedV);
                sound.playLock();
                const bIdx = updatedBalls.findIndex((b) => b.id === purpleItem.id);
                if (bIdx !== -1) {
                  updatedBalls[bIdx] = {
                    ...updatedBalls[bIdx],
                    isSecuredInVault: true,
                    isCarriedBy: 'none' as const,
                    x: currentVault.x,
                    y: currentVault.y,
                  };
                }
                setScore((s) => ({ ...s, team2VaultSecured: true, team2VaultSecuredCount: 1 }));
              }
            }

            // Ball pickup by bot
            if (r2.heldBalls.length < r2.maxCapacity) {
              for (let i = 0; i < updatedBalls.length; i++) {
                const b = updatedBalls[i];
                if (b.isCarriedBy === 'none' && !b.inAir && !b.isSecuredInVault && b.x >= 46) {
                  if (Math.hypot(b.x - nextX, b.y - nextY) < 8.5) {
                    b.isCarriedBy = 'p2' as const;
                    r2.heldBalls.push({ id: b.id, type: b.type });
                    sound.playPickup(b.type === 'purple');
                    break;
                  }
                }
              }
            }

            // Bot Shoot Action: Bot MUST charge for 1.0 second to shoot!
            const wantsToVault = r2.hasKey && r2.heldBalls.some((b) => b.type === 'purple') && botVaultLockedCount === 0;
            if (!wantsToVault && r2.heldBalls.length > 0 && botShootCooldown <= 0) {
              const isNearRamp = nextX <= 84;
              if (isNearRamp || r2.heldBalls.length >= 2 || dx < 0) {
                botChargingRef.current = true;
                botChargeTimeRef.current += dt;
                const bTime = botChargeTimeRef.current;
                setBotChargeTime(bTime);
                if (bTime >= 1.0) {
                  sound.playShoot();
                  const count = r2.heldBalls.length;
                  for (let i = 0; i < updatedBalls.length; i++) {
                    const b = updatedBalls[i];
                    if (b.isCarriedBy === 'p2') {
                      b.isCarriedBy = 'none' as const;
                      b.x = nextX - 4;
                      b.y = nextY + (Math.random() - 0.5) * 6;
                      b.vx = -64 - Math.random() * 8;
                      b.vy = (Math.random() - 0.5) * 6;
                      b.inAir = true;
                      b.airTime = 2.0;
                    }
                  }
                  setScore((s) => ({ ...s, team2Shots: s.team2Shots + count }));
                  r2.heldBalls = [];
                  botChargingRef.current = false;
                  botChargeTimeRef.current = 0;
                  setBotChargeTime(0);
                  botShootCooldown = mult >= 100 ? 0.8 : mult >= 4 ? 1.0 : 1.4;
                }
              } else {
                if (botChargingRef.current) {
                  botChargingRef.current = false;
                  botChargeTimeRef.current = 0;
                  setBotChargeTime(0);
                }
              }
            } else {
              if (botChargingRef.current) {
                botChargingRef.current = false;
                botChargeTimeRef.current = 0;
                setBotChargeTime(0);
              }
            }
          }
        }

        // 1-SECOND CHARGING SYSTEM FOR PLAYER 1 (ME / HOST)
        let shouldShootP1 = false;
        if (p1ChargingRef.current && r1.heldBalls.length > 0 && matchStageRef.current === 'PLAYING') {
          p1ChargeTimeRef.current += dt;
          const curTime = p1ChargeTimeRef.current;
          setP1ChargeTime(curTime);
          const now = performance.now();
          if (now - lastChargeHumRef.current >= 200) {
            sound.playChargeHum(Math.min(1.0, curTime / 1.0));
            lastChargeHumRef.current = now;
          }
          if (curTime >= 1.0) {
            sound.playChargeComplete();
            p1ChargingRef.current = false;
            p1ChargeTimeRef.current = 0;
            setP1ChargeTime(0);
            shouldShootP1 = true;
          }
        } else if (!p1ChargingRef.current && p1ChargeTimeRef.current > 0) {
          p1ChargeTimeRef.current = 0;
          setP1ChargeTime(0);
        }

        if (pendingShootP1Ref.current) {
          pendingShootP1Ref.current = false;
          shouldShootP1 = true;
        }

        if (shouldShootP1 && r1.heldBalls.length > 0) {
          sound.playShoot();
          const count = r1.heldBalls.length;
          for (let i = 0; i < updatedBalls.length; i++) {
            const b = updatedBalls[i];
            if (b.isCarriedBy === 'p1') {
              b.isCarriedBy = 'none' as const;
              b.x = r1.x + 4;
              b.y = r1.y + (Math.random() - 0.5) * 6;
              b.vx = 64 + Math.random() * 8; // Powerful velocity to clear the center ramp cleanly!
              b.vy = (Math.random() - 0.5) * 6;
              b.inAir = true;
              b.airTime = 2.0;
            }
          }
          r1.heldBalls = [];
          robot1Ref.current = { ...r1 };
          setRobot1({ ...r1 });
          setScore((s) => ({ ...s, team1Shots: s.team1Shots + count }));
        }

        // 1-SECOND CHARGING SYSTEM FOR PLAYER 2 (ONLINE GUEST)
        let shouldShootP2 = false;
        if (is2PlayerRef.current && isOnlineModeRef.current) {
          if (p2ChargingRef.current && r2.heldBalls.length > 0 && matchStageRef.current === 'PLAYING') {
            p2ChargeTimeRef.current += dt;
            const curTime = p2ChargeTimeRef.current;
            setP2ChargeTime(curTime);
            if (curTime >= 1.0) {
              sound.playChargeComplete();
              p2ChargingRef.current = false;
              p2ChargeTimeRef.current = 0;
              setP2ChargeTime(0);
              shouldShootP2 = true;
            }
          } else if (!p2ChargingRef.current && p2ChargeTimeRef.current > 0) {
            p2ChargeTimeRef.current = 0;
            setP2ChargeTime(0);
          }
        }

        if (pendingShootP2Ref.current) {
          pendingShootP2Ref.current = false;
          shouldShootP2 = true;
        }

        if (shouldShootP2 && r2.heldBalls.length > 0) {
          sound.playShoot();
          const count = r2.heldBalls.length;
          for (let i = 0; i < updatedBalls.length; i++) {
            const b = updatedBalls[i];
            if (b.isCarriedBy === 'p2') {
              b.isCarriedBy = 'none' as const;
              b.x = r2.x - 4;
              b.y = r2.y + (Math.random() - 0.5) * 6;
              b.vx = -64 - Math.random() * 8; // Powerful velocity to clear the center ramp cleanly!
              b.vy = (Math.random() - 0.5) * 6;
              b.inAir = true;
              b.airTime = 2.0;
            }
          }
          r2.heldBalls = [];
          robot2Ref.current = { ...r2 };
          setRobot2({ ...r2 });
          setScore((s) => ({ ...s, team2Shots: s.team2Shots + count }));
        }

        // 10-SECOND KNOCKOUT (KO) WATCHDOG: All 8 Orange Balls on One Side
        let t1OrangeCount = 0;
        let t2OrangeCount = 0;
        for (let i = 0; i < updatedBalls.length; i++) {
          const b = updatedBalls[i];
          if (b.type === 'orange') {
            if (b.isCarriedBy === 'p1' || (b.isCarriedBy === 'none' && b.x < 50)) {
              t1OrangeCount++;
            } else {
              t2OrangeCount++;
            }
          }
        }

        if (matchStageRef.current === 'PLAYING') {
          if (t1OrangeCount === 8 || t2OrangeCount === 8) {
            const danger = t1OrangeCount === 8 ? 'team1' : 'team2';
            if (koDangerSideRef.current !== danger) {
              koDangerSideRef.current = danger;
              koCountdownTimerRef.current = 10.0;
              lastKOBleepRef.current = 10;
              sound.playKOSiren();
              setJudgeMood('PENALTY');
              setJudgeCommentary(`"🚨 KNOCKOUT ALERT! All 8 Orange Balls on ${danger === 'team1' ? 'Team 1' : 'Team 2'} side! 10.0s to clear a ball over the ramp or KNOCKOUT LOSS (-4 to 9)!"`);
            } else {
              koCountdownTimerRef.current = Math.max(0, (koCountdownTimerRef.current ?? 10.0) - dt);
              const curSec = Math.ceil(koCountdownTimerRef.current);
              if (curSec !== lastKOBleepRef.current && curSec >= 1 && curSec <= 10) {
                lastKOBleepRef.current = curSec;
                sound.playKOSiren();
              }
              setKoState({ active: true, dangerSide: danger, secondsLeft: +koCountdownTimerRef.current.toFixed(1) });
              if (koCountdownTimerRef.current <= 0) {
                // KO Time Expired! The other side wins (-4 to 9 marks)!
                finalizeKO(danger === 'team1' ? 'team2' : 'team1');
              }
            }
          } else {
            if (koDangerSideRef.current !== null) {
              koDangerSideRef.current = null;
              koCountdownTimerRef.current = null;
              setKoState(null);
              sound.playWhistle(false);
              setJudgeMood('BALL_CLEARED');
              setJudgeCommentary(`"KO AVERTED! Ball cleared back over the center ramp!"`);
            }
          }
        }

        // Stick carried balls to robots
        for (let i = 0; i < updatedBalls.length; i++) {
          const b = updatedBalls[i];
          if (b.isCarriedBy === 'p1') {
            b.x = r1.x;
            b.y = r1.y;
          } else if (b.isCarriedBy === 'p2') {
            b.x = r2.x;
            b.y = r2.y;
          }
        }

        ballsRef.current = updatedBalls;
        setBalls(updatedBalls);
        setRobot1({ ...r1 });
        setRobot2({ ...r2 });

        // WebRTC Multiplayer Sync Broadcast from Host to Guest (25 Hz = 40ms)
        if (isOnlineModeRef.current && isOnlineHostRef.current) {
          if (currentTime - lastSyncTimeRef.current >= 40) {
            lastSyncTimeRef.current = currentTime;
            onlineService.sendMessage({
              type: 'SYNC_STATE',
              payload: {
                balls: updatedBalls.map((b) => ({
                  id: b.id,
                  x: +b.x.toFixed(1),
                  y: +b.y.toFixed(1),
                  vx: +b.vx.toFixed(1),
                  vy: +b.vy.toFixed(1),
                  type: b.type,
                  inAir: b.inAir,
                  isCarriedBy: b.isCarriedBy,
                  isSecuredInVault: b.isSecuredInVault,
                  side: b.side,
                })),
                robot1: {
                  x: +r1.x.toFixed(1),
                  y: +r1.y.toFixed(1),
                  angle: Math.round(r1.angle),
                  heldBalls: r1.heldBalls,
                  hasKey: r1.hasKey,
                },
                robot2Held: r2.heldBalls,
                robot2Key: r2.hasKey,
                score: scoreRef.current,
                team1Vault: team1VaultRef.current,
                team2Vault: team2VaultRef.current,
                team1Key: team1KeyRef.current,
                team2Key: team2KeyRef.current,
                timeRemaining: +timeRemainingRef.current.toFixed(1),
                matchStage: matchStageRef.current,
                countdownNumber: countdownNumberRef.current,
                koState,
                botChargeTime: +botChargeTimeRef.current.toFixed(2),
                p1ChargeTime: +p1ChargeTimeRef.current.toFixed(2),
                p2ChargeTime: +p2ChargeTimeRef.current.toFixed(2),
              },
            });
          }
        }
      } else {
        // GUEST IN ONLINE MULTIPLAYER:
        // Position updates arrive directly from Host's SYNC_STATE!
        // We handle guest's local charging progress smoothly at 60 FPS
        if (p2ChargingRef.current && robot2Ref.current.heldBalls.length > 0 && matchStageRef.current === 'PLAYING') {
          p2ChargeTimeRef.current += dt;
          const curTime = p2ChargeTimeRef.current;
          setP2ChargeTime(curTime);
          const now = performance.now();
          if (now - lastChargeHumRef.current >= 200) {
            sound.playChargeHum(Math.min(1.0, curTime / 1.0));
            lastChargeHumRef.current = now;
          }
          if (curTime >= 1.0) {
            sound.playChargeComplete();
            p2ChargingRef.current = false;
            p2ChargeTimeRef.current = 0;
            setP2ChargeTime(0);
            handleShootP2();
          }
        } else if (!p2ChargingRef.current && p2ChargeTimeRef.current > 0) {
          p2ChargeTimeRef.current = 0;
          setP2ChargeTime(0);
        }
      }

      physicsLoopRef.current = requestAnimationFrame(loop);
    };

    physicsLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (physicsLoopRef.current) cancelAnimationFrame(physicsLoopRef.current);
    };
  }, [matchStage, currentOpponent]);

  // Recalculate Live Marks (Orange = +1, Purple = -2, LESS MARKS WINS!)
  // Guarded to only dispatch setScore if marks or counts actually changed!
  useEffect(() => {
    // In online match, the Guest receives authoritative score from Host via SYNC_STATE!
    if (isOnlineModeRef.current && !isOnlineHostRef.current) return;

    let t1Orange = 0;
    let t1Purple = 0;
    let t2Orange = 0;
    let t2Purple = 0;

    balls.forEach((b) => {
      if (b.isSecuredInVault) {
        if (b.x < 50 || b.side === 'left') {
          if (b.type === 'purple') t1Purple++;
          else t1Orange++;
        } else {
          if (b.type === 'purple') t2Purple++;
          else t2Orange++;
        }
      } else if (b.isCarriedBy === 'p1' || (b.isCarriedBy === 'none' && b.x < 50)) {
        if (b.type === 'orange') t1Orange++;
        else t1Purple++;
      } else {
        if (b.type === 'orange') t2Orange++;
        else t2Purple++;
      }
    });

    const t1Marks = t1Orange * 1 + t1Purple * -2;
    const t2Marks = t2Orange * 1 + t2Purple * -2;

    setScore((s) => {
      if (
        s.team1Orange === t1Orange &&
        s.team1Purple === t1Purple &&
        s.team1Marks === t1Marks &&
        s.team2Orange === t2Orange &&
        s.team2Purple === t2Purple &&
        s.team2Marks === t2Marks
      ) {
        return s; // No re-render if score unchanged!
      }
      return {
        ...s,
        team1Orange: t1Orange,
        team1Purple: t1Purple,
        team1Marks: t1Marks,
        team2Orange: t2Orange,
        team2Purple: t2Purple,
        team2Marks: t2Marks,
      };
    });
  }, [balls]);

  // Online Multiplayer WebRTC Connection Handler
  useEffect(() => {
    const unsubMsg = onlineService.subscribeMessage((msg: OnlineMessage) => {
      if (msg.type === 'INPUT_P2') {
        if (isOnlineHostRef.current && msg.payload) {
          const { x, y, angle } = msg.payload;
          robot2Ref.current = {
            ...robot2Ref.current,
            x,
            y,
            angle,
          };
          setRobot2(robot2Ref.current);
        }
      } else if (msg.type === 'SHOOT_P2') {
        if (isOnlineHostRef.current) {
          handleShootP2();
        }
      } else if (msg.type === 'CHARGE_P2') {
        if (isOnlineHostRef.current) {
          p2ChargingRef.current = true;
        }
      } else if (msg.type === 'CHARGE_CANCEL_P2') {
        if (isOnlineHostRef.current) {
          p2ChargingRef.current = false;
          p2ChargeTimeRef.current = 0;
          setP2ChargeTime(0);
        }
      } else if (msg.type === 'START_MATCH') {
        if (!isOnlineHostRef.current && msg.payload) {
          const p = msg.payload;
          setIsInviteModalOpen(false);
          setIsOnlineMode(true);
          isOnlineModeRef.current = true;
          setIs2Player(true);
          is2PlayerRef.current = true;
          if (p.balls) {
            ballsRef.current = p.balls;
            setBalls(p.balls);
          }
          if (p.robot1) {
            robot1Ref.current = p.robot1;
            setRobot1(p.robot1);
          }
          if (p.robot2) {
            robot2Ref.current = p.robot2;
            setRobot2(p.robot2);
          }
          if (p.duration) {
            setRandomRoundDuration(p.duration);
            setTimeRemaining(p.duration);
            timeRemainingRef.current = p.duration;
          }
          if (p.vault1) { team1VaultRef.current = p.vault1; setTeam1Vault(p.vault1); }
          if (p.vault2) { team2VaultRef.current = p.vault2; setTeam2Vault(p.vault2); }
          if (p.key1) { team1KeyRef.current = p.key1; setTeam1Key(p.key1); }
          if (p.key2) { team2KeyRef.current = p.key2; setTeam2Key(p.key2); }

          setMatchStage('COUNTDOWN');
          matchStageRef.current = 'COUNTDOWN';
          setCountdownNumber(3);
          countdownNumberRef.current = 3;
          sound.playCountdown(false);
          setJudgeMood('COUNTDOWN');
          setJudgeCommentary(`"🌐 CROSS-COUNTRY BRAWL! 3, 2, 1, BRAWL!"`);
        }
      } else if (msg.type === 'COUNTDOWN_STEP') {
        if (!isOnlineHostRef.current && msg.payload) {
          const step = msg.payload.step;
          if (step > 0) {
            setMatchStage('COUNTDOWN');
            matchStageRef.current = 'COUNTDOWN';
            setCountdownNumber(step);
            countdownNumberRef.current = step;
            sound.playCountdown(false);
          } else if (step === 0) {
            setMatchStage('COUNTDOWN');
            matchStageRef.current = 'COUNTDOWN';
            setCountdownNumber(0);
            countdownNumberRef.current = 0;
            sound.playCountdown(true);
            sound.playWhistle();
            setJudgeMood('WHISTLE');
            setJudgeCommentary(`"TWEET! MATCH LIVE! Grab Key 🔑, secure Purple Balls 🟣 in Vault!"`);
          } else if (step < 0) {
            setCountdownNumber(null);
            countdownNumberRef.current = null;
            setMatchStage('PLAYING');
            matchStageRef.current = 'PLAYING';
            setJudgeMood('CHEERING');
            sound.startMusic();
          }
        }
      } else if (msg.type === 'RESTART_REQUEST') {
        if (isOnlineHostRef.current) {
          sound.playBooster();
          startMatchFlow(true);
        }
      } else if (msg.type === 'SYNC_STATE') {
        if (!isOnlineHostRef.current && msg.payload) {
          const p = msg.payload;
          if (p.balls) {
            ballsRef.current = p.balls;
            setBalls(p.balls);
          }
          if (p.robot1) {
            robot1Ref.current = {
              ...robot1Ref.current,
              x: p.robot1.x,
              y: p.robot1.y,
              angle: p.robot1.angle,
              heldBalls: p.robot1.heldBalls || robot1Ref.current.heldBalls,
              hasKey: p.robot1.hasKey !== undefined ? p.robot1.hasKey : robot1Ref.current.hasKey,
            };
            setRobot1({ ...robot1Ref.current });
          }
          if (p.robot2Held !== undefined) {
            robot2Ref.current = {
              ...robot2Ref.current,
              heldBalls: p.robot2Held,
              hasKey: !!p.robot2Key,
            };
            setRobot2({ ...robot2Ref.current });
          }
          if (p.score) {
            scoreRef.current = p.score;
            setScore(p.score);
          }
          if (p.team1Vault) { team1VaultRef.current = p.team1Vault; setTeam1Vault(p.team1Vault); }
          if (p.team2Vault) { team2VaultRef.current = p.team2Vault; setTeam2Vault(p.team2Vault); }
          if (p.team1Key) { team1KeyRef.current = p.team1Key; setTeam1Key(p.team1Key); }
          if (p.team2Key) { team2KeyRef.current = p.team2Key; setTeam2Key(p.team2Key); }
          if (p.timeRemaining !== undefined) {
            timeRemainingRef.current = p.timeRemaining;
            setTimeRemaining(p.timeRemaining);
          }
          if (p.matchStage && matchStageRef.current !== p.matchStage) {
            matchStageRef.current = p.matchStage;
            setMatchStage(p.matchStage);
          }
          if (p.countdownNumber !== undefined && countdownNumberRef.current !== p.countdownNumber) {
            countdownNumberRef.current = p.countdownNumber;
            setCountdownNumber(p.countdownNumber);
          }
          if (p.koState !== undefined) {
            setKoState(p.koState);
          }
          if (p.botChargeTime !== undefined) {
            setBotChargeTime(p.botChargeTime);
          }
          if (p.p1ChargeTime !== undefined) {
            setP1ChargeTime(p.p1ChargeTime);
          }
          if (p.p2ChargeTime !== undefined) {
            setP2ChargeTime(p.p2ChargeTime);
          }
        }
      } else if (msg.type === 'EMOTE') {
        if (msg.payload) {
          triggerFloatingEmote(msg.payload.text, msg.payload.sender);
        }
      }
    });

    const unsubState = onlineService.subscribeState((st: OnlineState) => {
      setOnlinePing(st.pingMs);
      if (st.isConnected && st.remotePlayerName) {
        setRemotePlayerName(st.remotePlayerName);
        setIsOnlineMode(true);
        isOnlineModeRef.current = true;
        setIs2Player(true);
        is2PlayerRef.current = true;
        setPlayer2Name(st.remotePlayerName);
      } else if (!st.isConnected && isOnlineModeRef.current) {
        setIsOnlineMode(false);
        isOnlineModeRef.current = false;
        setJudgeCommentary(`"Friend in remote country disconnected from match."`);
      }
    });

    return () => {
      unsubMsg();
      unsubState();
    };
  }, [handleShootP2, startMatchFlow]);

  const triggerFloatingEmote = (text: string, sender: 'p1' | 'p2') => {
    const id = Date.now() + Math.random();
    const x = sender === 'p1' ? robot1Ref.current.x : robot2Ref.current.x;
    const y = Math.max(15, (sender === 'p1' ? robot1Ref.current.y : robot2Ref.current.y) - 8);
    setFloatingEmotes((curr) => [...curr, { id, text, sender, x, y }]);
    sound.playPickup(false);
    setTimeout(() => {
      setFloatingEmotes((curr) => curr.filter((e) => e.id !== id));
    }, 2400);
  };

  const handleSendEmote = (text: string) => {
    const sender = isOnlineHostRef.current ? 'p1' : 'p2';
    onlineService.sendMessage({ type: 'EMOTE', payload: { text, sender } });
    triggerFloatingEmote(text, sender);
  };

  const handleStartOnlineMatch = (asHost: boolean, remoteName: string) => {
    setIsOnlineMode(true);
    setIsOnlineHost(asHost);
    isOnlineModeRef.current = true;
    isOnlineHostRef.current = asHost;
    setIs2Player(true);
    is2PlayerRef.current = true;
    setRemotePlayerName(remoteName);
    setPlayer2Name(remoteName);
    if (asHost) {
      startMatchFlow(true);
      setJudgeCommentary(`"🌐 CROSS-COUNTRY MATCH! ${profile.name} vs ${remoteName} connected across the world!"`);
    } else {
      setMatchStage('COUNTDOWN');
      matchStageRef.current = 'COUNTDOWN';
      setCountdownNumber(null);
      setJudgeCommentary(`"🌐 CONNECTED! Joined ${remoteName}'s arena. Waiting for host to launch..."`);
    }
  };

  const controlLabels = isOnlineMode && !isOnlineHost
    ? { p1Drive: 'WASD / ARROWS', p1Shoot: 'SPACE / ENTER' }
    : stationIndex === 1
    ? { p1Drive: 'WASD', p1Shoot: 'SPACE' }
    : stationIndex === 2
    ? { p1Drive: 'ARROWS', p1Shoot: 'ENTER' }
    : { p1Drive: 'IJKL', p1Shoot: 'P' };

  return (
    <div className="flex flex-col gap-3.5 bg-slate-900/60 p-2 sm:p-4 rounded-3xl border border-slate-800 shadow-2xl relative">
      {/* Station Screen Tag */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: profile.color }}
          />
          <h3 className="text-sm sm:text-base font-black font-display text-white">
            SCREEN #{stationIndex} · {profile.name}
          </h3>
          <span className="text-[10px] font-mono text-slate-400 hidden xs:inline">
            (Controls: {controlLabels.p1Drive} to drive, {controlLabels.p1Shoot} to shoot)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-500/30">
            {profile.tokens} PTS
          </span>
          <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-500/30">
            🟣 1 Purple Ball Each (Total 2)
          </span>
        </div>
      </div>

      {/* Judge Derrick Presiding */}
      <JudgeDerrick
        mood={judgeMood}
        commentary={judgeCommentary}
        compact={true}
        team1Ready={true}
        team2Ready={true}
        randomRoundDuration={randomRoundDuration}
      />

      {/* ScoreBoard */}
      <ScoreBoard
        stage={matchStage}
        title={
          isOnlineMode
            ? `Screen #${stationIndex} · 🌐 Cross-Country Match`
            : is2Player
            ? `Screen #${stationIndex} · 2-Player Clash`
            : stationIndex === 1 && !isCompactLayout
            ? `🏆 Stage 0${tournamentProgress.currentStage} ${
                tournamentProgress.currentStage === 3
                  ? '· Grand Finals vs Team Taiwan 🇹🇼'
                  : `· Match ${tournamentService.getWinsForStage(tournamentProgress, tournamentProgress.currentStage) + 1}/${tournamentService.getRequiredWinsForStage(tournamentProgress.currentStage)} vs ${currentOpponent.name}`
              }`
            : `${profile.name} vs ${currentOpponent.name}`
        }
        subtitle={`Drive with ${controlLabels.p1Drive}, shoot with ${controlLabels.p1Shoot}. Less marks wins!`}
        timeRemaining={timeRemaining}
        matchScore={score}
        p1Name={profile.name}
        p2Name={isOnlineMode ? remotePlayerName : is2Player ? player2Name : currentOpponent.name}
        randomRoundDuration={randomRoundDuration}
        isMuted={false}
        onToggleMute={() => sound.toggleMute()}
      />

      {/* RoboArena with 2 Purple Balls Vault and Dedicated Station Controls */}
      <RoboArena
        stage={matchStage}
        is2Player={is2Player}
        playerRobot={profile.robot}
        opponent={currentOpponent}
        player2Name={isOnlineMode ? remotePlayerName : player2Name}
        matchScore={score}
        balls={balls}
        robot1={robot1}
        robot2={robot2}
        team1Vault={team1Vault}
        team2Vault={team2Vault}
        team1Key={team1Key}
        team2Key={team2Key}
        onMoveP1={handleMoveP1}
        onMoveP2={handleMoveP2}
        onShootP1={handleShootP1}
        onShootP2={handleShootP2}
        countdownNumber={countdownNumber}
        team1Ready={true}
        team2Ready={true}
        onConfirmTeam1Ready={() => {}}
        onConfirmTeam2Ready={() => {}}
        randomRoundDuration={randomRoundDuration}
        p1ChargeTime={p1ChargeTime}
        p2ChargeTime={p2ChargeTime}
        botChargeTime={botChargeTime}
        onStartChargeP1={handleStartChargeP1}
        onCancelChargeP1={handleCancelChargeP1}
        onStartChargeP2={handleStartChargeP2}
        onCancelChargeP2={handleCancelChargeP2}
        koState={koState}
        timeRemaining={timeRemaining}
        tournamentInfo={
          !is2Player && !isOnlineMode
            ? lastTournamentResult || {
                stage: tournamentProgress.currentStage,
                matchNumber: tournamentService.getWinsForStage(tournamentProgress, tournamentProgress.currentStage) + 1,
                requiredWins: tournamentService.getRequiredWinsForStage(tournamentProgress.currentStage),
                isGrandFinals: tournamentProgress.currentStage === 3,
                isChampion: tournamentProgress.isChampion,
                stageCleared: false,
                isP1Win: false,
              }
            : undefined
        }
        onViewTournamentLadder={onNavigateToTournament}
        onRestartMatch={() => {
          if (isOnlineModeRef.current && !isOnlineHostRef.current) {
            onlineService.sendMessage({ type: 'RESTART_REQUEST' });
            sound.playBooster();
          } else {
            startMatchFlow(is2Player);
          }
        }}
        onSelectRoundDuration={(secs) => startMatchFlow(is2Player, secs)}
        onSkipCountdown={handleSkipCountdown}
        botSpeedMultiplier={botSpeedMultiplier}
        onSelectBotSpeed={handleSelectBotSpeed}
        stationNumber={stationIndex}
        controlKeysLabel={controlLabels}
        isOnline={isOnlineMode}
        isOnlineHost={isOnlineHost}
        onOpenOnlineInvite={() => setIsInviteModalOpen(true)}
        onlinePing={onlinePing}
        remotePlayerName={remotePlayerName}
        onSendEmote={handleSendEmote}
        floatingEmotes={floatingEmotes}
      />

      {/* Online Multiplayer Invite Modal */}
      <OnlineInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          onCloseForceOpenInviteModal?.();
          onClearInitialRoomCode?.();
        }}
        localPlayerName={profile.name}
        initialRoomCode={initialRoomCode}
        onStartOnlineMatch={handleStartOnlineMatch}
      />
    </div>
  );
};
