import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { sound } from '../services/audioService';

interface MobileSwipeBarProps {
  activeTab: 'MATCH' | 'TOURNAMENT' | 'SPEED_TRIAL' | 'WORKSHOP' | 'QUIZ';
  onOpenQuiz: () => void;
  onGoToCourt: () => void;
  cupsWon?: number;
}

export const MobileSwipeBar: React.FC<MobileSwipeBarProps> = ({
  activeTab,
  onOpenQuiz,
  onGoToCourt,
  cupsWon = 0,
}) => {
  const isQuiz = activeTab === 'QUIZ';
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging || startXRef.current === null || !trackRef.current) return;
      const trackWidth = trackRef.current.clientWidth - 52; // subtract thumb width
      if (trackWidth <= 0) return;

      const diff = clientX - startXRef.current;
      // In non-quiz mode, drag right (positive diff). In quiz mode, drag left (negative diff).
      let progress = 0;
      if (!isQuiz) {
        progress = Math.max(0, Math.min(1, diff / trackWidth));
      } else {
        progress = Math.max(0, Math.min(1, -diff / trackWidth));
      }
      setDragProgress(progress);
    },
    [isDragging, isQuiz]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragProgress >= 0.65) {
      // Swiped enough! Trigger action
      sound.playCorrect();
      if (!isQuiz) {
        onOpenQuiz();
      } else {
        onGoToCourt();
      }
    }
    setDragProgress(0);
    startXRef.current = null;
  }, [isDragging, dragProgress, isQuiz, onOpenQuiz, onGoToCourt]);

  // Touch event handlers for mobile phones
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Mouse event handlers for desktop testing
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onWindowMouseUp = () => {
      if (isDragging) handleEnd();
    };
    if (isDragging) {
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="md:hidden w-full px-2 py-1.5">
      <div
        ref={trackRef}
        onClick={() => {
          if (!isDragging) {
            if (!isQuiz) onOpenQuiz();
            else onGoToCourt();
          }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        className={`relative h-12 w-full rounded-2xl flex items-center px-1.5 shadow-lg overflow-hidden cursor-pointer select-none border transition-all ${
          !isQuiz
            ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950/80 border-rose-500/50 shadow-rose-950/50'
            : 'bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950/80 border-cyan-500/50 shadow-cyan-950/50'
        }`}
      >
        {/* Animated Background Progress Track */}
        <div
          className={`absolute inset-y-0 ${
            !isQuiz ? 'left-0 bg-gradient-to-r from-rose-600/30 to-amber-500/40' : 'right-0 bg-gradient-to-l from-cyan-600/30 to-indigo-500/40'
          } transition-all duration-75`}
          style={{ width: `${dragProgress * 100}%` }}
        />

        {/* Center Prompt Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          {!isQuiz ? (
            <div className="flex items-center gap-1.5 text-center text-xs font-black tracking-wide uppercase">
              <span className="text-rose-400 animate-pulse">👉 SWIPE RIGHT</span>
              <span className="text-white font-display">TO OPEN MIXUE QUIZ</span>
              <span className="text-amber-400">🍦</span>
              {cupsWon > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] bg-rose-600 text-white rounded-full font-mono font-bold">
                  {cupsWon}🏆
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-center text-xs font-black tracking-wide uppercase">
              <span className="text-cyan-400 animate-pulse">👈 SWIPE LEFT</span>
              <span className="text-white font-display">RETURN TO ARENA</span>
              <span className="text-emerald-400">🤖</span>
            </div>
          )}
        </div>

        {/* Shimmer Arrows Animation */}
        {!isQuiz && (
          <div className="absolute right-3 flex items-center text-rose-400/60 pointer-events-none">
            <ChevronRight className="w-4 h-4 animate-ping" />
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
        {isQuiz && (
          <div className="absolute left-3 flex items-center text-cyan-400/60 pointer-events-none">
            <ChevronLeft className="w-4 h-4" />
            <ChevronLeft className="w-4 h-4 animate-ping" />
          </div>
        )}

        {/* Draggable Thumb Knob */}
        <div
          className={`absolute top-1 bottom-1 w-11 rounded-xl shadow-xl flex items-center justify-center transition-transform active:scale-95 z-10 ${
            !isQuiz
              ? 'bg-gradient-to-tr from-rose-500 via-rose-600 to-amber-400 text-white border-2 border-white ring-2 ring-rose-400/50'
              : 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-white border-2 border-white ring-2 ring-cyan-400/50'
          }`}
          style={{
            transform: !isQuiz
              ? `translateX(${dragProgress * ((trackRef.current?.clientWidth || 300) - 52)}px)`
              : `translateX(${((trackRef.current?.clientWidth || 300) - 52) * (1 - dragProgress)}px)`,
            transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          }}
        >
          {!isQuiz ? (
            <span className="text-xl filter drop-shadow">🍦</span>
          ) : (
            <span className="text-xl filter drop-shadow">🤖</span>
          )}
        </div>
      </div>

      {/* Direct Tap Action Pill (Alternative for users who prefer tap over swipe) */}
      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Slide knob or tap bar anytime</span>
        </span>
        <button
          onClick={!isQuiz ? onOpenQuiz : onGoToCourt}
          className={`font-black font-display text-[11px] underline cursor-pointer ${
            !isQuiz ? 'text-amber-400 hover:text-amber-300' : 'text-cyan-400 hover:text-cyan-300'
          }`}
        >
          {!isQuiz ? 'Tap to Launch Quiz 🍦' : 'Tap for Court 🤖'}
        </button>
      </div>
    </div>
  );
};
