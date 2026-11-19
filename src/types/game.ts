/**
 * WRO RoboSports Competition Types
 * Double Tennis Form with WASD/Arrow Movement & Ball Shooting
 * Chief Referee: Judge Derrick
 */

export type GameMode = 'TOURNAMENT' | 'VERSUS_2P' | 'SPEED_TRIAL' | 'WORKSHOP';

export type MatchStage = 
  | 'STANDBY'           // Preparing at paddock
  | 'ARE_YOU_READY'     // Derrick: "Team 1 ready? Team 2 ready?"
  | 'COUNTDOWN'         // Derrick: "3... 2... 1... GO!"
  | 'PLAYING'           // Active WASD / Arrow robot driving & shooting
  | 'FALSE_START'       // Penalty for early moving
  | 'ROUND_OVER'        // Whistle blows at 0.0s, Derrick counts marks
  | 'MATCH_OVER';       // Derrick certifies set winner

export type JudgeMood = 
  | 'READY' 
  | 'ASKING_READY' 
  | 'COUNTDOWN' 
  | 'WHISTLE' 
  | 'CHEERING' 
  | 'PENALTY' 
  | 'BALL_CLEARED' 
  | 'VICTORY';

export type BallType = 'orange' | 'purple';

export interface TennisBall {
  id: number;
  type: BallType; // 'orange' (+1 mark) | 'purple' (-2 marks)
  x: number;      // 0 to 100 (%)
  y: number;      // 0 to 100 (%)
  vx: number;     // velocity X
  vy: number;     // velocity Y
  side: 'left' | 'right';
  inAir: boolean; // sailing over central ramp
  airTime?: number; // seconds remaining in flight
  isCarriedBy: 'none' | 'p1' | 'p2';
  isSecuredInVault: boolean;
}

export interface VaultBox {
  team: 'team1' | 'team2';
  x: number; // %
  y: number; // %
  isSecured: boolean; // true if at least 1 purple ball is locked inside!
  securedCount: number; // 0, 1, or 2 purple balls locked!
  maxCapacity: number; // up to 2 purple balls can be saved!
}

export interface KeyItem {
  id: string;
  team: 'team1' | 'team2';
  x: number;
  y: number;
  isCollected: boolean;
  carriedBy: 'none' | 'p1' | 'p2';
}

export interface CourtRobot {
  id: string;
  name: string;
  team: 'team1' | 'team2';
  x: number;      // % of court
  y: number;      // % of court
  vx: number;
  vy: number;
  angle: number;  // facing angle in radians
  heldBalls: Array<{ id: number; type: BallType }>; // max 5 balls!
  maxCapacity: number; // 5
  color: string;
  hasKey: boolean;
}

export interface RobotStats {
  id: string;
  name: string;
  team: string;
  country: string;
  primaryColor: string;
  accentColor: string;
  image: string;
  motorLevel: number;
  overdriveChargeRate: number;
  coolingEfficiency: number;
  description: string;
}

export interface OpponentBot {
  id: string;
  name: string;
  team: string;
  country: string;
  image: string;
  speed: number;
  shootAccuracy: number;
  difficulty: 'Rookie' | 'National' | 'World Class' | 'Grand Champion' | string;
  quote: string;
}

export interface MatchScore {
  team1Orange: number;
  team1Purple: number;
  team1Marks: number;    // team1Orange * 1 + team1Purple * (-2) (lower is better!)
  team1VaultSecured: boolean;
  team1VaultSecuredCount: number; // 0, 1, or 2 purple balls locked (-2 or -4 marks)
  
  team2Orange: number;
  team2Purple: number;
  team2Marks: number;    // team2Orange * 1 + team2Purple * (-2) (lower is better!)
  team2VaultSecured: boolean;
  team2VaultSecuredCount: number; // 0, 1, or 2 purple balls locked (-2 or -4 marks)

  team1Shots: number;
  team2Shots: number;
  randomRoundDuration: number; // 30.0 to 60.0 seconds
  winner: 'team1' | 'team2' | 'draw' | null;
  isKO?: boolean;
  koWinner?: 'team1' | 'team2' | null;
}

export type ScreenLayout = '1_SCREEN' | '2_SCREENS' | '3_SCREENS';

export interface PlayerProfile {
  id: string; // 'slot_1' | 'slot_2' | 'slot_3'
  slotNumber: number; // 1, 2, or 3
  name: string;
  tagline: string;
  color: string;
  tokens: number;
  robot: RobotStats;
  currentTierId: string;
  unlockedTierIds: string[];
  completedTierIds: string[];
  purpleMode: 1 | 2; // Choose to save 1 or 2 purple balls in vault
  botSpeedMultiplier?: number; // 1x, 10x, 50x, or 100x GOD BOT!
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    purpleBallsSecuredTotal: number;
    maxLockdowns: number; // times player locked both 2 purple balls
  };
  bestSpeedRecord: SpeedTrialRecord | null;
  lastSavedAt: string;
  tournamentProgress?: TournamentProgress;
  mixueProgress?: MixueProgress;
}

export interface MixueProgress {
  correctCount: number; // current streak / progress towards next shout (0-5)
  totalCorrect: number;
  shoutChancesAvailable: number; // accumulated shouts to Derrick (1 earned per 5 correct)
  shoutsGiven: number; // total shouts shouted towards the 10 needed for prize
  cupsWon: number;
  lastPrizeAt?: string;
}

export interface TournamentProgress {
  currentStage: 1 | 2 | 3;
  stage1Wins: number; // 0 to 5
  stage2Wins: number; // 0 to 5
  stage3Wins: number; // 0 to 1 (vs team Taiwan)
  isChampion: boolean;
  totalTournamentWins: number;
  completedAt?: string;
}

export interface TournamentTier {
  id: string;
  tierName: string;
  stageName: string;
  location: string;
  opponent: OpponentBot;
  tokenReward: number;
  completed: boolean;
  unlocked: boolean;
}

export interface SpeedTrialRecord {
  id: string;
  date: string;
  duration: number;
  totalTaps: number;
  averageCps: number;
  peakCps: number;
  derrickCertification: string;
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
}
