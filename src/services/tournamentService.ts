import { OpponentBot, TournamentProgress } from '../types/game';

export interface TournamentStageConfig {
  stageNumber: 1 | 2 | 3;
  id: string;
  name: string;
  subtitle: string;
  location: string;
  requiredWins: number;
  tokenRewardPerWin: number;
  stageClearReward: number;
  bots: OpponentBot[];
  description: string;
}

export const TOURNAMENT_STAGES: TournamentStageConfig[] = [
  {
    stageNumber: 1,
    id: 'stage_1',
    name: 'Stage 1: Regional Qualifiers',
    subtitle: 'Junior Double Tennis District Arena',
    location: 'District Center · Court 1',
    requiredWins: 5,
    tokenRewardPerWin: 200,
    stageClearReward: 500,
    description: 'Win 5 matches with bot contenders to qualify for Stage 2. Bots start at rookie agility and ramp up gradually.',
    bots: [
      {
        id: 'bot_s1_1',
        name: 'RoboPupil Mk-1',
        team: 'Tech Academy High',
        country: 'Japan',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.25,
        shootAccuracy: 0.72,
        difficulty: 'Rookie Contender',
        quote: 'Our school robotics club tuned this bot to compete in the regional Double Tennis division!',
      },
      {
        id: 'bot_s1_2',
        name: 'Circuit Cadet',
        team: 'Neo Tokyo Robotics',
        country: 'Japan',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.35,
        shootAccuracy: 0.75,
        difficulty: 'Rookie Advanced',
        quote: 'Fast dual roller intakes allow us to quickly pick up rolling tennis balls!',
      },
      {
        id: 'bot_s1_3',
        name: 'GearGrinder S1',
        team: 'Berlin Mech Lab',
        country: 'Germany',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.45,
        shootAccuracy: 0.78,
        difficulty: 'Regional Amateur',
        quote: 'High-torque drive motors hold court positioning steadily against opponent shots.',
      },
      {
        id: 'bot_s1_4',
        name: 'Delta Roller',
        team: 'Seoul Youth STEM',
        country: 'South Korea',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.55,
        shootAccuracy: 0.80,
        difficulty: 'Amateur Finalist',
        quote: 'Rapid side-to-side defense! Do not let our court side fill with balls!',
      },
      {
        id: 'bot_s1_5',
        name: 'Regional Ace',
        team: 'EuroBotics Youth',
        country: 'France',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.65,
        shootAccuracy: 0.83,
        difficulty: 'Regional Boss',
        quote: 'Win against us and you secure your official ticket to the National Semifinals!',
      },
    ],
  },
  {
    stageNumber: 2,
    id: 'stage_2',
    name: 'Stage 2: National Championship',
    subtitle: 'National Center Arena · Stronger Bots Tier',
    location: 'National Center · Center Court',
    requiredWins: 5,
    tokenRewardPerWin: 350,
    stageClearReward: 1000,
    description: 'Win 5 matches with bot contenders to advance to the Grand Finals. Every stage the bots get stronger with higher speeds and pneumatic power!',
    bots: [
      {
        id: 'bot_s2_1',
        name: 'CyberClaw S2',
        team: 'Neon Circuit Club',
        country: 'Germany',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.85,
        shootAccuracy: 0.86,
        difficulty: 'National Contender',
        quote: 'We rebuilt our chassis with carbon fiber. Our ramp clears are instantaneous!',
      },
      {
        id: 'bot_s2_2',
        name: 'Vortex Raptor',
        team: 'Silverstone Mech',
        country: 'United Kingdom',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 1.95,
        shootAccuracy: 0.88,
        difficulty: 'National Pro',
        quote: 'Aerodynamic chassis and fast reaction cycle—our intercept timing is razor sharp.',
      },
      {
        id: 'bot_s2_3',
        name: 'Titanium Blitz',
        team: 'Nordic Dynamics',
        country: 'Sweden',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 2.05,
        shootAccuracy: 0.90,
        difficulty: 'National Elite',
        quote: 'Reinforced titanium alloy chassis built to dominate and punish court stalls.',
      },
      {
        id: 'bot_s2_4',
        name: 'Phantom Striker',
        team: 'Singapore RoboWorks',
        country: 'Singapore',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 2.15,
        shootAccuracy: 0.92,
        difficulty: 'National Master',
        quote: 'Lightning quick court sweeping! One mistake and you face a 10-second Knockout!',
      },
      {
        id: 'bot_s2_5',
        name: 'Apex Titan WRO',
        team: 'Dynasty Robotics',
        country: 'United States',
        image: '/images/rival_robot_1790947986992.jpg',
        speed: 2.25,
        shootAccuracy: 0.94,
        difficulty: 'National Champion',
        quote: 'National Champion titleholder! Only the best will earn a chance at the Grand Finals!',
      },
    ],
  },
  {
    stageNumber: 3,
    id: 'stage_3',
    name: 'Stage 3: Grand Finals',
    subtitle: 'WRO World Double Tennis Grand Final',
    location: 'Olympic Arena · Grand Finals Center Court',
    requiredWins: 1,
    tokenRewardPerWin: 1500,
    stageClearReward: 2000,
    description: 'The pinnacle of international robotics sports! Win 1 match against team Taiwan to claim the World Championship title!',
    bots: [
      {
        id: 'bot_taiwan_champion',
        name: 'Formosa Striker TWN',
        team: 'Taiwan',
        country: 'Taiwan',
        image: '/images/taiwan_robot_champion_1791590774691.jpg',
        speed: 2.45,
        shootAccuracy: 0.96,
        difficulty: 'World Grand Champion',
        quote: 'We represent Team Taiwan in the Grand Finals! Defeat us in this single decisive match to become the World Champion!',
      },
    ],
  },
];

export const getDefaultTournamentProgress = (): TournamentProgress => ({
  currentStage: 1,
  stage1Wins: 0,
  stage2Wins: 0,
  stage3Wins: 0,
  isChampion: false,
  totalTournamentWins: 0,
});

export class TournamentService {
  public getDefaultProgress(): TournamentProgress {
    return getDefaultTournamentProgress();
  }

  public getStageConfig(stageNumber: 1 | 2 | 3): TournamentStageConfig {
    return TOURNAMENT_STAGES.find((s) => s.stageNumber === stageNumber) || TOURNAMENT_STAGES[0];
  }

  public getRequiredWinsForStage(stageNumber: 1 | 2 | 3): number {
    if (stageNumber === 1) return 5;
    if (stageNumber === 2) return 5;
    return 1; // Stage 3 Grand Finals only needs 1 win against team Taiwan!
  }

  public getWinsForStage(progress: TournamentProgress, stageNumber: 1 | 2 | 3): number {
    if (stageNumber === 1) return Math.min(5, progress.stage1Wins || 0);
    if (stageNumber === 2) return Math.min(5, progress.stage2Wins || 0);
    return Math.min(1, progress.stage3Wins || 0);
  }

  public getCurrentOpponent(progress: TournamentProgress): OpponentBot {
    const stage = progress.currentStage;
    const stageConfig = this.getStageConfig(stage);
    const wins = this.getWinsForStage(progress, stage);

    // Pick bot corresponding to current match index (bounded by available bots)
    const botIndex = Math.min(wins, stageConfig.bots.length - 1);
    return stageConfig.bots[botIndex] || stageConfig.bots[0];
  }

  public recordWin(current: TournamentProgress): {
    updatedProgress: TournamentProgress;
    stageCleared: boolean;
    becameChampion: boolean;
    rewardTokens: number;
    currentBot: OpponentBot;
    clearedStageNumber: 1 | 2 | 3;
  } {
    const stage = current.currentStage;
    const stageConfig = this.getStageConfig(stage);
    const currentWins = this.getWinsForStage(current, stage);
    const botIndex = Math.min(currentWins, stageConfig.bots.length - 1);
    const defeatedBot = stageConfig.bots[botIndex];

    const newWins = currentWins + 1;
    let stageCleared = false;
    let becameChampion = false;
    let nextStage: 1 | 2 | 3 = stage;
    let rewardTokens = stageConfig.tokenRewardPerWin;

    const updated: TournamentProgress = {
      ...current,
      totalTournamentWins: (current.totalTournamentWins || 0) + 1,
    };

    if (stage === 1) {
      updated.stage1Wins = Math.min(5, newWins);
      if (updated.stage1Wins >= 5) {
        stageCleared = true;
        nextStage = 2;
        rewardTokens += stageConfig.stageClearReward;
      }
    } else if (stage === 2) {
      updated.stage2Wins = Math.min(5, newWins);
      if (updated.stage2Wins >= 5) {
        stageCleared = true;
        nextStage = 3;
        rewardTokens += stageConfig.stageClearReward;
      }
    } else if (stage === 3) {
      // Grand Finals vs Taiwan (only 1 win needed!)
      updated.stage3Wins = 1;
      stageCleared = true;
      becameChampion = true;
      updated.isChampion = true;
      updated.completedAt = new Date().toISOString();
      rewardTokens += stageConfig.stageClearReward;
    }

    updated.currentStage = nextStage;

    return {
      updatedProgress: updated,
      stageCleared,
      becameChampion,
      rewardTokens,
      currentBot: defeatedBot,
      clearedStageNumber: stage,
    };
  }

  public resetTournament(): TournamentProgress {
    return {
      currentStage: 1,
      stage1Wins: 0,
      stage2Wins: 0,
      stage3Wins: 0,
      isChampion: false,
      totalTournamentWins: 0,
    };
  }
}

export const tournamentService = new TournamentService();
