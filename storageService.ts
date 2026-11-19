import { PlayerProfile, RobotStats, ScreenLayout } from '../types/game';

export const DEFAULT_ROBOTS: Record<string, RobotStats> = {
  slot_1: {
    id: 'robot_crimson',
    name: 'Crimson Striker',
    team: 'Challenger Alpha',
    country: 'United States',
    primaryColor: '#ef4444',
    accentColor: '#f59e0b',
    image: '/images/player_robot_1790947974702.jpg',
    motorLevel: 1,
    overdriveChargeRate: 1.0,
    coolingEfficiency: 1.0,
    description: 'All-around tournament chassis tuned for rapid ramp shots and purple ball locking.',
  },
  slot_2: {
    id: 'robot_cyber',
    name: 'CyberClaw S2',
    team: 'Neon Circuit Club',
    country: 'Japan',
    primaryColor: '#06b6d4',
    accentColor: '#3b82f6',
    image: '/images/rival_robot_1790947986992.jpg',
    motorLevel: 1,
    overdriveChargeRate: 1.0,
    coolingEfficiency: 1.0,
    description: 'High-speed agile interceptor with dual purple ball vault containment.',
  },
  slot_3: {
    id: 'robot_titan',
    name: 'Apex Dynamo',
    team: 'Quantum Robotics',
    country: 'Germany',
    primaryColor: '#8b5cf6',
    accentColor: '#ec4899',
    image: '/images/player_robot_1790947974702.jpg',
    motorLevel: 1,
    overdriveChargeRate: 1.0,
    coolingEfficiency: 1.0,
    description: 'Heavy duty competitive frame engineered for maximum lock efficiency.',
  },
};

export const createDefaultProfile = (slotNumber: number): PlayerProfile => {
  const slotId = `slot_${slotNumber}`;
  const defaultRobot = DEFAULT_ROBOTS[slotId] || DEFAULT_ROBOTS['slot_1'];

  return {
    id: slotId,
    slotNumber,
    name: `Player ${slotNumber}`,
    tagline: slotNumber === 1 ? 'Circuit Champion' : slotNumber === 2 ? 'Speed Demon' : 'Vault Specialist',
    color: slotNumber === 1 ? '#ef4444' : slotNumber === 2 ? '#06b6d4' : '#8b5cf6',
    tokens: 150,
    robot: { ...defaultRobot },
    currentTierId: 'tier_regional',
    unlockedTierIds: ['tier_regional'],
    completedTierIds: [],
    purpleMode: 1, // Exactly 1 purple ball per side (total 2 purple balls only!)
    botSpeedMultiplier: 2, // Balanced 2x competitive speed (slower a little bit, smooth & fun!)
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      purpleBallsSecuredTotal: 0,
      maxLockdowns: 0,
    },
    bestSpeedRecord: null,
    tournamentProgress: {
      currentStage: 1,
      stage1Wins: 0,
      stage2Wins: 0,
      stage3Wins: 0,
      isChampion: false,
      totalTournamentWins: 0,
    },
    mixueProgress: {
      correctCount: 0,
      totalCorrect: 0,
      shoutChancesAvailable: 0,
      shoutsGiven: 0,
      cupsWon: 0,
    },
    lastSavedAt: new Date().toISOString(),
  };
};

const STORAGE_PREFIX = 'wro_robosports_';

class StorageService {
  public getActiveSlotId(): string {
    try {
      return localStorage.getItem(`${STORAGE_PREFIX}active_slot`) || 'slot_1';
    } catch {
      return 'slot_1';
    }
  }

  public setActiveSlotId(slotId: string): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}active_slot`, slotId);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public getScreenLayout(): ScreenLayout {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}screen_layout`);
      if (saved === '1_SCREEN' || saved === '2_SCREENS' || saved === '3_SCREENS') {
        return saved;
      }
      return '1_SCREEN';
    } catch {
      return '1_SCREEN';
    }
  }

  public setScreenLayout(layout: ScreenLayout): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}screen_layout`, layout);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public loadProfile(slotId: string): PlayerProfile {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}profile_${slotId}`);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...createDefaultProfile(Number(slotId.replace('slot_', '')) || 1),
          ...parsed,
        };
      }
    } catch (e) {
      console.warn(`Failed to parse profile ${slotId}:`, e);
    }

    const slotNum = Number(slotId.replace('slot_', '')) || 1;
    const initial = createDefaultProfile(slotNum);
    this.saveProfile(initial);
    return initial;
  }

  public saveProfile(profile: PlayerProfile): void {
    try {
      const updated = {
        ...profile,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}profile_${profile.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }

  public getAllProfiles(): PlayerProfile[] {
    return [
      this.loadProfile('slot_1'),
      this.loadProfile('slot_2'),
      this.loadProfile('slot_3'),
    ];
  }

  public exportAllData(): string {
    const profiles = this.getAllProfiles();
    const activeSlot = this.getActiveSlotId();
    const layout = this.getScreenLayout();

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeSlot,
      layout,
      profiles,
    };

    return JSON.stringify(backup, null, 2);
  }

  public importAllData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.profiles)) {
        parsed.profiles.forEach((p: PlayerProfile) => {
          if (p.id) {
            localStorage.setItem(`${STORAGE_PREFIX}profile_${p.id}`, JSON.stringify(p));
          }
        });
        if (parsed.activeSlot) this.setActiveSlotId(parsed.activeSlot);
        if (parsed.layout) this.setScreenLayout(parsed.layout);
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }

  public resetProfile(slotId: string): PlayerProfile {
    const slotNum = Number(slotId.replace('slot_', '')) || 1;
    const fresh = createDefaultProfile(slotNum);
    this.saveProfile(fresh);
    return fresh;
  }
}

export const storage = new StorageService();
