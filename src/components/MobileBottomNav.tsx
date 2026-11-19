import React from 'react';
import { Bot, Trophy, Timer, Wrench, Sparkles } from 'lucide-react';
import { ScreenLayout } from '../types/game';

interface MobileBottomNavProps {
  activeTab: 'MATCH' | 'TOURNAMENT' | 'SPEED_TRIAL' | 'WORKSHOP' | 'QUIZ';
  onSelectTab: (tab: 'MATCH' | 'TOURNAMENT' | 'SPEED_TRIAL' | 'WORKSHOP' | 'QUIZ') => void;
  screenLayout: ScreenLayout;
  onSetSingleScreen: () => void;
  cupsWon?: number;
  tokens?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  screenLayout,
  onSetSingleScreen,
  cupsWon = 0,
  tokens = 0,
}) => {
  const handleTabClick = (tab: 'MATCH' | 'TOURNAMENT' | 'SPEED_TRIAL' | 'WORKSHOP' | 'QUIZ') => {
    if (screenLayout !== '1_SCREEN') {
      onSetSingleScreen();
    }
    onSelectTab(tab);
  };

  const isQuizActive = screenLayout === '1_SCREEN' && activeTab === 'QUIZ';

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-1.5 py-1 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.7)] select-none safe-area-pb">
      {/* 1. COURT ARENA */}
      <button
        onClick={() => handleTabClick('MATCH')}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
          screenLayout === '1_SCREEN' && activeTab === 'MATCH'
            ? 'text-amber-400 font-black bg-slate-900/80 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Bot className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-display uppercase tracking-tight">Court</span>
      </button>

      {/* 2. TOURNAMENT LADDER */}
      <button
        onClick={() => handleTabClick('TOURNAMENT')}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
          screenLayout === '1_SCREEN' && activeTab === 'TOURNAMENT'
            ? 'text-amber-400 font-black bg-slate-900/80 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Trophy className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-display uppercase tracking-tight">Ladder</span>
      </button>

      {/* 3. SPEED DYNO */}
      <button
        onClick={() => handleTabClick('SPEED_TRIAL')}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
          screenLayout === '1_SCREEN' && activeTab === 'SPEED_TRIAL'
            ? 'text-amber-400 font-black bg-slate-900/80 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Timer className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-display uppercase tracking-tight">Dyno</span>
      </button>

      {/* 4. WORKSHOP & UPGRADES */}
      <button
        onClick={() => handleTabClick('WORKSHOP')}
        className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
          screenLayout === '1_SCREEN' && activeTab === 'WORKSHOP'
            ? 'text-amber-400 font-black bg-slate-900/80 shadow-sm'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <Wrench className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] font-display uppercase tracking-tight">Paddock</span>
        {tokens > 0 && (
          <span className="absolute top-0 right-1 px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono text-[8px] font-bold">
            {tokens}
          </span>
        )}
      </button>

      {/* 5. DEDICATED MIXUE QUIZ (High-visibility pulsing button) */}
      <button
        onClick={() => handleTabClick('QUIZ')}
        className={`flex-1.2 py-1.5 px-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
          isQuizActive
            ? 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.6)] ring-2 ring-white/80'
            : 'bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-amber-950/80 text-rose-300 border border-rose-500/60 shadow-md animate-pulse'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className="text-base leading-none">🍦</span>
          {cupsWon > 0 && (
            <span className="text-[8px] bg-rose-950 text-amber-300 px-1 rounded-full font-mono font-black border border-amber-400/40">
              {cupsWon}🏆
            </span>
          )}
        </div>
        <span className="text-[10px] font-display font-black tracking-tight uppercase whitespace-nowrap mt-0.5">
          Mixue Quiz
        </span>

        {/* Highlight notification ping dot */}
        {!isQuizActive && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
        )}
      </button>
    </nav>
  );
};
