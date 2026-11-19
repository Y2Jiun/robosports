/**
 * WRO RoboSports Competition - Official Double Tennis Championship
 * WASD / Arrow Keys Movement, Ball Pickup & Shooting Mechanics
 * Scoring: Orange Ball = +1 Mark · Purple Ball = -2 Marks · The Less Marks The Better!
 * Features:
 * - Choose to save 1 or 2 Purple Balls in Vault Safe (up to -4 Marks saved!)
 * - Progress Saver (Auto-save to localStorage, player slots, export/import JSON)
 * - Different screens for up to 3 different players on the same website (1, 2, or 3 simultaneous screens!)
 * Chief Referee: Judge Derrick
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Users,
  Timer,
  Wrench,
  Volume2,
  VolumeX,
  Save,
  Check,
  Tv,
  LayoutGrid,
  Bot,
  User,
  Sparkles,
  Globe2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import {
  ScreenLayout,
  PlayerProfile,
  TournamentTier,
  SpeedTrialRecord,
  OpponentBot,
} from './types/game';
import { sound } from './services/audioService';
import { storage } from './services/storageService';
import { RoboGameStation } from './components/RoboGameStation';
import { TournamentLadder } from './components/TournamentLadder';
import { RobotCustomizer } from './components/RobotCustomizer';
import { SpeedTrial } from './components/SpeedTrial';
import { ProgressSaverModal } from './components/ProgressSaverModal';
import { TournamentVictoryModal } from './components/TournamentVictoryModal';
import { tournamentService } from './services/tournamentService';
import { MixueQuizSection } from './components/MixueQuizSection';
import { MobileSwipeBar } from './components/MobileSwipeBar';
import { MobileBottomNav } from './components/MobileBottomNav';

const TOURNAMENT_TIERS: TournamentTier[] = [
  {
    id: 'tier_regional',
    tierName: 'Regional Qualifier',
    stageName: 'Junior Regional Double Tennis',
    location: 'District Arena · Court 1',
    tokenReward: 200,
    completed: false,
    unlocked: true,
    opponent: {
      id: 'bot_pupil',
      name: 'RoboPupil Mk-1',
      team: 'Tech Academy High',
      country: 'Japan',
      image: '/images/rival_robot_1790947986992.jpg',
      speed: 1.3,
      shootAccuracy: 0.75,
      difficulty: 'Rookie',
      quote: "Our school lab built this robot to compete in the regional Double Tennis table!",
    },
  },
  {
    id: 'tier_national',
    tierName: 'National Semifinal',
    stageName: 'National Double Tennis Semifinal',
    location: 'National Center · Center Court',
    tokenReward: 400,
    completed: false,
    unlocked: false,
    opponent: {
      id: 'bot_cyberclaw',
      name: 'CyberClaw S2',
      team: 'Neon Circuit Club',
      country: 'Germany',
      image: '/images/rival_robot_1790947986992.jpg',
      speed: 1.7,
      shootAccuracy: 0.88,
      difficulty: 'National',
      quote: "We spent months tuning our double tennis ramp kickers. Fasten your belts!",
    },
  },
  {
    id: 'tier_world',
    tierName: 'World Grand Final',
    stageName: 'WRO World Double Tennis Grand Final',
    location: 'Olympic Arena · Center Court',
    tokenReward: 800,
    completed: false,
    unlocked: false,
    opponent: {
      id: 'bot_titan',
      name: 'Apex Titan WRO',
      team: 'Dynasty Robotics',
      country: 'United States',
      image: '/images/rival_robot_1790947986992.jpg',
      speed: 2.1,
      shootAccuracy: 0.95,
      difficulty: 'World Class',
      quote: "Defending World Double Tennis Champions. Judge Derrick knows our clearing speed is unmatched!",
    },
  },
];

export default function App() {
  // Profiles & Progress Saver State
  const [profiles, setProfiles] = useState<PlayerProfile[]>(() => storage.getAllProfiles());
  const [activeSlotId, setActiveSlotId] = useState<string>(() => storage.getActiveSlotId());
  const [screenLayout, setScreenLayout] = useState<ScreenLayout>(() => storage.getScreenLayout());
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [urlRoomCode, setUrlRoomCode] = useState<string | undefined>(undefined);
  // Tab navigation for Solo Screen
  const [activeTab, setActiveTab] = useState<'MATCH' | 'TOURNAMENT' | 'SPEED_TRIAL' | 'WORKSHOP' | 'QUIZ'>('MATCH');
  const tabBarRef = useRef<HTMLDivElement>(null);

  const TAB_ORDER: Array<'MATCH' | 'TOURNAMENT' | 'SPEED_TRIAL' | 'WORKSHOP' | 'QUIZ'> = [
    'MATCH',
    'TOURNAMENT',
    'SPEED_TRIAL',
    'WORKSHOP',
    'QUIZ',
  ];

  const handleNextTab = () => {
    setActiveTab((curr) => {
      const idx = TAB_ORDER.indexOf(curr);
      const next = TAB_ORDER[(idx + 1) % TAB_ORDER.length];
      return next;
    });
  };

  const handlePrevTab = () => {
    setActiveTab((curr) => {
      const idx = TAB_ORDER.indexOf(curr);
      const prev = TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length];
      return prev;
    });
  };

  // Screen-level horizontal touch swipe listener for Android & mobile phones
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleGlobalTouchStart = (e: React.TouchEvent) => {
    // Only track single touch
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleGlobalTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Minimum swipe distance: 45px, horizontal dominance over vertical
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      if (deltaX < 0) {
        // Swipe Left (finger moved right-to-left) -> advance to next tab
        handleNextTab();
      } else {
        // Swipe Right (finger moved left-to-right) -> user requested: "swipe to the right to find the button"
        if (activeTab === 'MATCH' || activeTab === 'WORKSHOP') {
          setActiveTab('QUIZ');
        } else {
          handlePrevTab();
        }
      }
    }
  };

  // Auto-scroll tab rail when switching to Quiz
  useEffect(() => {
    if (tabBarRef.current && activeTab === 'QUIZ') {
      tabBarRef.current.scrollTo({ left: tabBarRef.current.scrollWidth, behavior: 'smooth' });
    }
  }, [activeTab]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [activeTournamentBot, setActiveTournamentBot] = useState<OpponentBot | undefined>(undefined);

  // Auto-detect invite link with ?room=XYZ from another country
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        setUrlRoomCode(room);
        setActiveTab('MATCH');
        setScreenLayout('1_SCREEN');
        setIsOnlineModalOpen(true);
      }
    } catch {}
  }, []);

  // Active Player Profile
  const activeProfile = profiles.find((p) => p.id === activeSlotId) || profiles[0];

  // Auto-save whenever active profile changes
  const handleUpdateProfile = (updated: PlayerProfile) => {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    storage.saveProfile(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleSelectSlot = (slotId: string) => {
    setActiveSlotId(slotId);
    storage.setActiveSlotId(slotId);
  };

  const handleSelectLayout = (layout: ScreenLayout) => {
    setScreenLayout(layout);
    storage.setScreenLayout(layout);
  };

  const handleResetSlot = (slotId: string) => {
    const fresh = storage.resetProfile(slotId);
    setProfiles((prev) => prev.map((p) => (p.id === slotId ? fresh : p)));
  };

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  // Workshop upgrades for active profile
  const handleUpgrade = (type: 'motor' | 'overdrive' | 'cooling', cost: number) => {
    if (activeProfile.tokens < cost) return;

    const nextRobot = { ...activeProfile.robot };
    if (type === 'motor') nextRobot.motorLevel += 1;
    if (type === 'overdrive') nextRobot.overdriveChargeRate = +(nextRobot.overdriveChargeRate + 0.15).toFixed(2);
    if (type === 'cooling') nextRobot.coolingEfficiency = +(nextRobot.coolingEfficiency + 0.15).toFixed(2);

    const updated: PlayerProfile = {
      ...activeProfile,
      tokens: activeProfile.tokens - cost,
      robot: nextRobot,
    };
    handleUpdateProfile(updated);
  };

  const handleUpdateRobotInfo = (name: string, team: string) => {
    const updated: PlayerProfile = {
      ...activeProfile,
      name,
      robot: {
        ...activeProfile.robot,
        name,
        team,
      },
    };
    handleUpdateProfile(updated);
  };

  const handleRecordSaved = (record: SpeedTrialRecord) => {
    const isNewBest = !activeProfile.bestSpeedRecord || record.averageCps > activeProfile.bestSpeedRecord.averageCps;
    if (isNewBest) {
      const updated: PlayerProfile = {
        ...activeProfile,
        tokens: activeProfile.tokens + 150,
        bestSpeedRecord: record,
      };
      handleUpdateProfile(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased touch-manipulation">
      {/* GLOBAL TOP NAVIGATION */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        
        {/* Brand & Derrick Ref Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow font-black text-slate-950 font-display">
            WRO
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black font-display tracking-tight text-white flex items-center gap-1.5">
              <span>RoboSports Double Tennis</span>
              <span className="hidden sm:inline text-xs text-amber-400 font-mono">· Chief Judge Derrick</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden xs:block">
              1 Purple Ball per Side (Total 2) · Lock in Vault Safe 📦 · Play Online Worldwide 🌐 · Progress Saver
            </p>
          </div>
        </div>

        {/* SCREEN LAYOUT SELECTOR (1, 2, OR 3 SCREENS FOR EVERYONE) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
          <span className="text-[10px] font-mono text-slate-400 px-1 font-bold hidden md:inline">SCREENS:</span>
          
          <button
            onClick={() => handleSelectLayout('1_SCREEN')}
            title="1 Screen Solo View"
            className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              screenLayout === '1_SCREEN'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1 Screen</span>
            <span className="sm:hidden font-mono">1S</span>
          </button>

          <button
            onClick={() => handleSelectLayout('2_SCREENS')}
            title="2 Screens (Dual Play on Same Website)"
            className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              screenLayout === '2_SCREENS'
                ? 'bg-cyan-400 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2 Screens</span>
            <span className="sm:hidden font-mono">2S</span>
          </button>

          <button
            onClick={() => handleSelectLayout('3_SCREENS')}
            title="3 Screens (3 Different People Playing Simultaneously)"
            className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              screenLayout === '3_SCREENS'
                ? 'bg-purple-500 text-white font-black shadow ring-2 ring-purple-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3 Screens (3 Players)</span>
            <span className="hidden sm:inline md:hidden">3 Screens</span>
            <span className="sm:hidden font-mono">3S</span>
          </button>
        </div>

        {/* RIGHT CONTROLS: PROGRESS SAVER, MUTED, AND DIRECT QUIZ BUTTON */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* MOBILE DIRECT MIXUE QUIZ SHORTCUT */}
          <button
            onClick={() => {
              if (screenLayout !== '1_SCREEN') handleSelectLayout('1_SCREEN');
              setActiveTab('QUIZ');
              if (tabBarRef.current) {
                tabBarRef.current.scrollTo({ left: tabBarRef.current.scrollWidth, behavior: 'smooth' });
              }
            }}
            className="md:hidden px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-400 text-white font-black text-xs flex items-center gap-1 shadow-md border border-rose-300/80 active:scale-95 cursor-pointer font-display animate-pulse"
            title="Open Mixue Quiz"
          >
            <span className="text-sm">🍦</span>
            <span className="font-display">QUIZ</span>
            {activeProfile.mixueProgress && activeProfile.mixueProgress.cupsWon > 0 && (
              <span className="text-[9px] bg-slate-950 text-amber-300 px-1 rounded-full font-mono font-bold">
                {activeProfile.mixueProgress.cupsWon}🏆
              </span>
            )}
          </button>

          {/* Active Slot Quick-Switch (in 1 Screen mode) */}
          {screenLayout === '1_SCREEN' && (
            <div className="hidden lg:flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-xl">
              {profiles.map((p) => {
                const isActive = p.id === activeSlotId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectSlot(p.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-white font-bold shadow border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* PLAY WITH FRIENDS (CROSS-COUNTRY) BUTTON */}
          <button
            onClick={() => setIsOnlineModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-display ring-1 ring-indigo-400/50"
          >
            <Globe2 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">INVITE FRIEND</span>
            <span className="sm:hidden">INVITE</span>
          </button>

          {/* PROGRESS SAVER BUTTON */}
          <button
            onClick={() => setIsProgressModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-display"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">PROGRESS SAVER</span>
            <span className="xs:hidden">SAVE</span>
            {saveToast && <Check className="w-3.5 h-3.5 text-slate-950 animate-bounce" />}
          </button>

          {/* MUTE TOGGLE */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* DEDICATED INTERACTIVE MOBILE SWIPE BAR (SLIDE RIGHT TO OPEN MIXUE QUIZ) */}
      {screenLayout === '1_SCREEN' && (
        <MobileSwipeBar
          activeTab={activeTab}
          onOpenQuiz={() => {
            setActiveTab('QUIZ');
            if (tabBarRef.current) {
              tabBarRef.current.scrollTo({ left: tabBarRef.current.scrollWidth, behavior: 'smooth' });
            }
          }}
          onGoToCourt={() => setActiveTab('MATCH')}
          cupsWon={activeProfile.mixueProgress?.cupsWon || 0}
        />
      )}

      {/* SUB-HEADER / TAB NAVIGATION (in 1-Screen mode) */}
      {screenLayout === '1_SCREEN' && (
        <div className="bg-slate-900 border-b border-slate-800 px-2 sm:px-6 py-1.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-xs">
          {/* Scrollable & Swipeable Tab Strip flanked by Left / Right arrows */}
          <div className="relative flex items-center min-w-0 flex-1 gap-1">
            {/* Left Chevron for quick one-tap tab scrolling */}
            <button
              onClick={() => {
                if (tabBarRef.current) {
                  tabBarRef.current.scrollBy({ left: -160, behavior: 'smooth' });
                }
              }}
              title="Scroll tabs left"
              className="md:hidden shrink-0 p-1.5 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={tabBarRef}
              className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-none py-1 px-1 touch-pan-x scroll-smooth w-full overscroll-x-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <button
                onClick={() => setActiveTab('MATCH')}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'MATCH'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Court Arena</span>
              </button>

              <button
                onClick={() => setActiveTab('TOURNAMENT')}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'TOURNAMENT'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tournament Ladder</span>
              </button>

              <button
                onClick={() => setActiveTab('SPEED_TRIAL')}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'SPEED_TRIAL'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Speed Dyno</span>
              </button>

              <button
                onClick={() => setActiveTab('WORKSHOP')}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'WORKSHOP'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Paddock & Upgrades ({activeProfile.tokens} PTS)</span>
              </button>

              <button
                onClick={() => setActiveTab('QUIZ')}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'QUIZ'
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 shadow font-black ring-2 ring-rose-400'
                    : 'text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-500/30'
                }`}
              >
                <span className="text-sm">🍦</span>
                <span>Mixue Quiz (Blooket)</span>
                {activeProfile.mixueProgress && activeProfile.mixueProgress.cupsWon > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-rose-950 text-rose-300 rounded-full font-mono font-bold">
                    {activeProfile.mixueProgress.cupsWon}🏆
                  </span>
                )}
              </button>
            </div>

            {/* Right Chevron for quick one-tap tab scrolling */}
            <button
              onClick={() => {
                if (tabBarRef.current) {
                  tabBarRef.current.scrollBy({ left: 160, behavior: 'smooth' });
                }
              }}
              title="Scroll tabs right"
              className="md:hidden shrink-0 p-1.5 rounded-lg bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Profile Info */}
          <div className="flex items-center justify-between md:justify-end gap-2 px-1 text-[11px] md:text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-400 hidden sm:inline">Playing as:</span>
              <span
                className="font-bold text-xs font-display px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${activeProfile.color}25`, color: activeProfile.color, border: `1px solid ${activeProfile.color}50` }}
              >
                {activeProfile.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING QUICK MIXUE BUTTON FOR ANDROID PHONES (When not on Quiz, positioned above bottom nav) */}
      {screenLayout === '1_SCREEN' && activeTab !== 'QUIZ' && (
        <button
          onClick={() => {
            setActiveTab('QUIZ');
            if (tabBarRef.current) {
              tabBarRef.current.scrollTo({ left: tabBarRef.current.scrollWidth, behavior: 'smooth' });
            }
          }}
          className="md:hidden fixed bottom-16 right-3 z-40 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-400 text-white font-black font-display text-xs px-3 py-2 rounded-2xl shadow-[0_4px_25px_rgba(244,63,94,0.7)] border-2 border-white flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
        >
          <span className="text-base">🍦</span>
          <span>Mixue Quiz</span>
          <ChevronRight className="w-3.5 h-3.5 text-white stroke-[3]" />
        </button>
      )}

      {/* MULTI-SCREEN HEADER BANNER (when in 2 or 3 screens) */}
      {screenLayout !== '1_SCREEN' && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/30 px-3 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="font-bold text-white">
              {screenLayout === '3_SCREENS'
                ? '🎮 3-PLAYER ARCADIA: 3 Individual Screens active simultaneously on the same website!'
                : '🎮 2-PLAYER DUAL VIEW: 2 Individual Screens active simultaneously!'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-purple-300 hidden md:block">
            Screen 1: WASD+Space · Screen 2: Arrows+Enter · Screen 3: IJKL+P
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT (With screen-wide horizontal swipe navigation for mobile phones) */}
      <main
        onTouchStart={handleGlobalTouchStart}
        onTouchEnd={handleGlobalTouchEnd}
        className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-5 pb-24 md:pb-6 flex flex-col gap-6"
      >
        
        {/* VIEW 1: SINGLE SCREEN SOLO FOCUSED */}
        {screenLayout === '1_SCREEN' && (
          <div className="flex flex-col gap-6">
            {activeTab === 'MATCH' && (
              <RoboGameStation
                key={activeSlotId}
                stationIndex={Number(activeSlotId.replace('slot_', '')) as 1 | 2 | 3 || 1}
                profile={activeProfile}
                onUpdateProfile={handleUpdateProfile}
                initialRoomCode={urlRoomCode}
                onClearInitialRoomCode={() => setUrlRoomCode(undefined)}
                forceOpenInviteModal={isOnlineModalOpen}
                onCloseForceOpenInviteModal={() => setIsOnlineModalOpen(false)}
                tournamentOpponent={activeTournamentBot}
                onTournamentWin={({ becameChampion }) => {
                  if (becameChampion) {
                    setIsCelebrationOpen(true);
                  }
                }}
                onNavigateToTournament={() => setActiveTab('TOURNAMENT')}
              />
            )}

            {activeTab === 'TOURNAMENT' && (
              <div className="flex flex-col gap-6">
                <TournamentLadder
                  profile={activeProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onStartMatch={(bot) => {
                    setActiveTournamentBot(bot);
                    setActiveTab('MATCH');
                  }}
                  onOpenCelebration={() => setIsCelebrationOpen(true)}
                  onRestartTournament={() => {
                    const resetProg = tournamentService.resetTournament();
                    handleUpdateProfile({
                      ...activeProfile,
                      tournamentProgress: resetProg,
                    });
                    setIsCelebrationOpen(false);
                  }}
                />
              </div>
            )}

            {activeTab === 'SPEED_TRIAL' && (
              <SpeedTrial
                onRecordSaved={handleRecordSaved}
                bestRecord={activeProfile.bestSpeedRecord}
              />
            )}

            {activeTab === 'WORKSHOP' && (
              <RobotCustomizer
                robot={activeProfile.robot}
                tokens={activeProfile.tokens}
                onUpgrade={handleUpgrade}
                onUpdateInfo={handleUpdateRobotInfo}
              />
            )}

            {activeTab === 'QUIZ' && (
              <MixueQuizSection
                profile={activeProfile}
                onUpdateProfile={handleUpdateProfile}
                onGoToCourt={() => setActiveTab('MATCH')}
              />
            )}
          </div>
        )}

        {/* VIEW 2: 2 SCREENS SIDE-BY-SIDE (DUAL PLAY FOR 2 PEOPLE ON THE SAME WEBSITE) */}
        {screenLayout === '2_SCREENS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            <RoboGameStation
              stationIndex={1}
              profile={profiles[0]}
              onUpdateProfile={handleUpdateProfile}
              isCompactLayout={true}
            />
            <RoboGameStation
              stationIndex={2}
              profile={profiles[1]}
              onUpdateProfile={handleUpdateProfile}
              isCompactLayout={true}
            />
          </div>
        )}

        {/* VIEW 3: 3 SCREENS SIDE-BY-SIDE (3 INDIVIDUAL SCREENS FOR 3 DIFFERENT PEOPLE) */}
        {screenLayout === '3_SCREENS' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 w-full">
            <RoboGameStation
              stationIndex={1}
              profile={profiles[0]}
              onUpdateProfile={handleUpdateProfile}
              isCompactLayout={true}
            />
            <RoboGameStation
              stationIndex={2}
              profile={profiles[1]}
              onUpdateProfile={handleUpdateProfile}
              isCompactLayout={true}
            />
            <RoboGameStation
              stationIndex={3}
              profile={profiles[2]}
              onUpdateProfile={handleUpdateProfile}
              isCompactLayout={true}
            />
          </div>
        )}
      </main>

      {/* PROGRESS SAVER MODAL */}
      <ProgressSaverModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        profiles={profiles}
        activeSlotId={activeSlotId}
        onSelectSlot={handleSelectSlot}
        onUpdateProfile={handleUpdateProfile}
        onResetSlot={handleResetSlot}
      />

      {/* TOURNAMENT VICTORY CELEBRATION MODAL */}
      <TournamentVictoryModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        onRestartTournament={() => {
          const resetProg = tournamentService.resetTournament();
          handleUpdateProfile({
            ...activeProfile,
            tournamentProgress: resetProg,
          });
          setIsCelebrationOpen(false);
        }}
        profile={activeProfile}
      />

      {/* PERMANENT MOBILE BOTTOM NAVIGATION (Always visible & accessible on Android & iPhone) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tabBarRef.current && tab === 'QUIZ') {
            tabBarRef.current.scrollTo({ left: tabBarRef.current.scrollWidth, behavior: 'smooth' });
          }
        }}
        screenLayout={screenLayout}
        onSetSingleScreen={() => handleSelectLayout('1_SCREEN')}
        cupsWon={activeProfile.mixueProgress?.cupsWon || 0}
        tokens={activeProfile.tokens}
      />
    </div>
  );
}
