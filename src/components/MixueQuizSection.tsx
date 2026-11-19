import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Check,
  XCircle,
  HelpCircle,
  Volume2,
  Award,
  Trophy,
  RotateCcw,
  Clock,
  Compass,
  ArrowRight,
  Flame,
  Zap,
} from 'lucide-react';
import { PlayerProfile, MixueProgress } from '../types/game';
import { sound } from '../services/audioService';
import { MixuePrizeModal } from './MixuePrizeModal';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  category: 'degrees' | 'location' | 'acc_dec' | 'min_max' | 'motion_calc' | string;
  turnNumber?: 1 | 2 | 3 | 4;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'how many degrees is turn 1',
    options: ['90 degrees', '180 degrees', '270 degrees', '360 degrees'],
    correctAnswer: '270 degrees',
    category: 'degrees',
    turnNumber: 1,
  },
  {
    id: 2,
    question: 'how many degrees is turn 2',
    options: ['90 degrees', '180 degrees', '270 degrees', '360 degrees'],
    correctAnswer: '360 degrees',
    category: 'degrees',
    turnNumber: 2,
  },
  {
    id: 3,
    question: 'how many degrees is turn 3',
    options: ['90 degrees', '180 degrees', '270 degrees', '360 degrees'],
    correctAnswer: '90 degrees',
    category: 'degrees',
    turnNumber: 3,
  },
  {
    id: 4,
    question: 'how many degrees is turn 4',
    options: ['90 degrees', '180 degrees', '270 degrees', '360 degrees'],
    correctAnswer: '180 degrees',
    category: 'degrees',
    turnNumber: 4,
  },
  {
    id: 5,
    question: 'where is turn 1',
    options: ['top left', 'top right', 'bottom left', 'bottom right'],
    correctAnswer: 'top left',
    category: 'location',
    turnNumber: 1,
  },
  {
    id: 6,
    question: 'where is turn 2',
    options: ['top left', 'top right', 'bottom left', 'bottom right'],
    correctAnswer: 'top right',
    category: 'location',
    turnNumber: 2,
  },
  {
    id: 7,
    question: 'where is turn 3',
    options: ['top left', 'top right', 'bottom left', 'bottom right'],
    correctAnswer: 'bottom right',
    category: 'location',
    turnNumber: 3,
  },
  {
    id: 8,
    question: 'where is turn 4',
    options: ['top left', 'top right', 'bottom left', 'bottom right'],
    correctAnswer: 'bottom left',
    category: 'location',
    turnNumber: 4,
  },
  {
    id: 9,
    question: 'which turn turns 90 degrees',
    options: ['turn 1', 'turn 2', 'turn 3', 'turn 4'],
    correctAnswer: 'turn 3',
    category: 'degrees',
    turnNumber: 3,
  },
  {
    id: 10,
    question: 'which turn turns 180 degrees',
    options: ['turn 1', 'turn 2', 'turn 3', 'turn 4'],
    correctAnswer: 'turn 4',
    category: 'degrees',
    turnNumber: 4,
  },
  {
    id: 11,
    question: 'which turn turns 270 degrees',
    options: ['turn 1', 'turn 2', 'turn 3', 'turn 4'],
    correctAnswer: 'turn 1',
    category: 'degrees',
    turnNumber: 1,
  },
  {
    id: 12,
    question: 'which turn turns 360 degrees',
    options: ['turn 1', 'turn 2', 'turn 3', 'turn 4'],
    correctAnswer: 'turn 2',
    category: 'degrees',
    turnNumber: 2,
  },
  {
    id: 13,
    question: 'what is acc',
    options: [
      'the back range that run the minimum speed',
      'the front range that run the minimum speed',
    ],
    correctAnswer: 'the front range that run the minimum speed',
    category: 'acc_dec',
  },
  {
    id: 14,
    question: 'what is dec',
    options: [
      'the back range that run the minimum speed',
      'the front range that run the minimum speed',
    ],
    correctAnswer: 'the back range that run the minimum speed',
    category: 'acc_dec',
  },
  {
    id: 15,
    question: 'what is min',
    options: [
      'the minimum power of the range',
      'the maximum power of the range',
    ],
    correctAnswer: 'the minimum power of the range',
    category: 'min_max',
  },
  {
    id: 16,
    question: 'what is max',
    options: [
      'the minimum power of the range',
      'the maximum power of the range',
    ],
    correctAnswer: 'the maximum power of the range',
    category: 'min_max',
  },
  {
    id: 17,
    question:
      'if the full range is 1200, the acc of the range is 100, and the dec is 200, the min is 30, and max is 100, what will be the speed of the 900 range in the middle',
    options: ['30', '100', '70', '10'],
    correctAnswer: '100',
    category: 'motion_calc',
  },
  {
    id: 18,
    question:
      'if the full range is 300, the acc of the range is 50, and the dec is 100, the min is 80, and max is 100, what will be the speed of the 50 range in the start',
    options: ['50', '100', '80', '20'],
    correctAnswer: '80',
    category: 'motion_calc',
  },
];

// Fisher-Yates array randomizer helper
export function shuffleArray<T>(items: readonly T[] | T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Vibrant Blooket-style button palette
const BLOOKET_COLORS = [
  {
    bg: 'bg-rose-500 hover:bg-rose-400 active:bg-rose-600',
    border: 'border-b-4 border-rose-700 active:border-b-0 active:translate-y-1',
    shadow: 'shadow-[0_6px_0_0_#9f1239]',
    text: 'text-white',
    icon: '🔴',
  },
  {
    bg: 'bg-blue-500 hover:bg-blue-400 active:bg-blue-600',
    border: 'border-b-4 border-blue-700 active:border-b-0 active:translate-y-1',
    shadow: 'shadow-[0_6px_0_0_#1d4ed8]',
    text: 'text-white',
    icon: '🔷',
  },
  {
    bg: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600',
    border: 'border-b-4 border-amber-700 active:border-b-0 active:translate-y-1',
    shadow: 'shadow-[0_6px_0_0_#b45309]',
    text: 'text-slate-950 font-black',
    icon: '⭐',
  },
  {
    bg: 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600',
    border: 'border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1',
    shadow: 'shadow-[0_6px_0_0_#047857]',
    text: 'text-white',
    icon: '🟩',
  },
];

const DERRICK_SHOUT_REACTIONS = [
  "📢 MIXUE?! What is that ice cream chant?! Keep answering right!",
  "📢 I hear you shouting MIXUE loud and clear! (2/10)",
  "📢 MIXUE Snow King power! Keep getting 5 correct! (3/10)",
  "📢 Derrick is craving soft-serve now! Keep shouting! (4/10)",
  "📢 Halfway to the ice cream cup! MIXUE! (5/10)",
  "📢 The entire robotics stadium heard that MIXUE shout! (6/10)",
  "📢 7 shouts! Judge Derrick's referee whistle is vibrating! (7/10)",
  "📢 Almost there! 8/10 MIXUE shouts! Deliciousness awaits! (8/10)",
  "📢 ONE MORE SHOUT TO GO FOR THE COLD MIXUE CUP! (9/10)",
  "🎉 Ur prize! Derrick hands over a frosty cup of Mixue! (10/10)",
];

interface MixueQuizSectionProps {
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onGoToCourt?: () => void;
}

export const MixueQuizSection: React.FC<MixueQuizSectionProps> = ({
  profile,
  onUpdateProfile,
  onGoToCourt,
}) => {
  // Current question index in question pool
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Randomized questions pool
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>(() =>
    shuffleArray(QUIZ_QUESTIONS)
  );

  // Quiz state: 'QUESTION' | 'CORRECT' | 'WRONG'
  const [quizState, setQuizState] = useState<'QUESTION' | 'CORRECT' | 'WRONG'>('QUESTION');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Penalty countdown for wrong answer (3.0s down to 0)
  const [penaltySeconds, setPenaltySeconds] = useState(3);
  const penaltyTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Local mixue state synchronized with profile
  const mixueProgress: MixueProgress = profile.mixueProgress || {
    correctCount: 0,
    totalCorrect: 0,
    shoutChancesAvailable: 0,
    shoutsGiven: 0,
    cupsWon: 0,
  };

  // Shout animation feedback
  const [shoutAnimation, setShoutAnimation] = useState<string | null>(null);
  const [derrickQuote, setDerrickQuote] = useState<string>(
    mixueProgress.shoutsGiven > 0 && mixueProgress.shoutsGiven < 10
      ? DERRICK_SHOUT_REACTIONS[mixueProgress.shoutsGiven - 1]
      : 'Answer 5 questions correctly to shout MIXUE to Judge Derrick! 10 shouts unlocks Ur prize!'
  );

  // Prize Modal
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);

  // Track field reference open/collapse and active reference tab ('TURNS' | 'MOTION')
  const [showTrackMap, setShowTrackMap] = useState(true);
  const [referenceTab, setReferenceTab] = useState<'TURNS' | 'MOTION'>('TURNS');

  // Current question with randomized options per question
  const currentQ = useMemo(() => {
    const base = shuffledQuestions[currentQIndex % shuffledQuestions.length] || QUIZ_QUESTIONS[0];
    return {
      ...base,
      options: shuffleArray(base.options),
    };
  }, [shuffledQuestions, currentQIndex]);

  // Auto-switch reference guide to match current question type
  useEffect(() => {
    if (['acc_dec', 'min_max', 'motion_calc'].includes(currentQ.category)) {
      setReferenceTab('MOTION');
    } else if (currentQ.turnNumber) {
      setReferenceTab('TURNS');
    }
  }, [currentQ]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (penaltyTimerRef.current) clearInterval(penaltyTimerRef.current);
    };
  }, []);

  // Move to next question with automatic reshuffle when completing the pool
  const advanceToNextQuestion = useCallback(() => {
    if (penaltyTimerRef.current) {
      clearInterval(penaltyTimerRef.current);
      penaltyTimerRef.current = null;
    }
    setQuizState('QUESTION');
    setSelectedAnswer(null);
    setPenaltySeconds(3);
    setCurrentQIndex((prev) => {
      const next = prev + 1;
      if (next >= shuffledQuestions.length) {
        setShuffledQuestions(shuffleArray(QUIZ_QUESTIONS));
        return 0;
      }
      return next;
    });
  }, [shuffledQuestions.length]);

  // Blooket mechanism: When in CORRECT screen, "click anywhere to continus"
  useEffect(() => {
    if (quizState !== 'CORRECT') return;

    const handleAnywhereClick = (e: MouseEvent | KeyboardEvent) => {
      // Prevent double trigger if clicking modal buttons
      if ((e.target as HTMLElement)?.closest('button[data-modal-ignore]')) return;
      advanceToNextQuestion();
    };

    window.addEventListener('click', handleAnywhereClick);
    window.addEventListener('keydown', handleAnywhereClick);

    return () => {
      window.removeEventListener('click', handleAnywhereClick);
      window.removeEventListener('keydown', handleAnywhereClick);
    };
  }, [quizState, advanceToNextQuestion]);

  // Answer click handler
  const handleSelectOption = (option: string) => {
    if (quizState !== 'QUESTION') return;

    setSelectedAnswer(option);
    const isCorrect = option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      sound.playCorrect();
      setQuizState('CORRECT');

      // Update mixue progress: every 5 correct answers gives 1 shout
      const newCorrectCount = mixueProgress.correctCount + 1;
      const earnedShout = newCorrectCount >= 5;
      const updatedMixue: MixueProgress = {
        ...mixueProgress,
        totalCorrect: mixueProgress.totalCorrect + 1,
        correctCount: earnedShout ? 0 : newCorrectCount,
        shoutChancesAvailable: mixueProgress.shoutChancesAvailable + (earnedShout ? 1 : 0),
      };

      if (earnedShout) {
        sound.playBooster();
        setDerrickQuote('🎉 5 CORRECT REACHED! You earned 1 SHOUT to shout MIXUE at Judge Derrick!');
      }

      onUpdateProfile({
        ...profile,
        tokens: profile.tokens + 15,
        mixueProgress: updatedMixue,
        lastSavedAt: new Date().toISOString(),
      });
    } else {
      sound.playWrong();
      setQuizState('WRONG');
      setPenaltySeconds(3);

      if (penaltyTimerRef.current) clearInterval(penaltyTimerRef.current);

      let timeLeft = 3;
      penaltyTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setPenaltySeconds(timeLeft);
        if (timeLeft <= 0) {
          if (penaltyTimerRef.current) clearInterval(penaltyTimerRef.current);
          penaltyTimerRef.current = null;
        }
      }, 1000);
    }
  };

  // Shout "MIXUE" to Derrick
  const handleShoutMixue = () => {
    if (mixueProgress.shoutChancesAvailable <= 0) return;

    sound.playMixueShout();
    const nextShoutsGiven = mixueProgress.shoutsGiven + 1;
    const isPrizeTime = nextShoutsGiven >= 10;

    // Derrick's quote
    const reaction = isPrizeTime
      ? '🎉 "Ur prize!" Judge Derrick serves up a frosty cup of Mixue!'
      : DERRICK_SHOUT_REACTIONS[Math.min(nextShoutsGiven - 1, DERRICK_SHOUT_REACTIONS.length - 1)];
    setDerrickQuote(reaction);

    // Megaphone flash animation
    setShoutAnimation(`MIXUE! (${nextShoutsGiven}/10)`);
    setTimeout(() => setShoutAnimation(null), 2500);

    const updatedMixue: MixueProgress = {
      ...mixueProgress,
      shoutChancesAvailable: mixueProgress.shoutChancesAvailable - 1,
      shoutsGiven: isPrizeTime ? 0 : nextShoutsGiven, // resets counter for next cup after winning!
      cupsWon: mixueProgress.cupsWon + (isPrizeTime ? 1 : 0),
      lastPrizeAt: isPrizeTime ? new Date().toISOString() : mixueProgress.lastPrizeAt,
    };

    const updatedTokens = isPrizeTime ? profile.tokens + 500 : profile.tokens + 25;

    onUpdateProfile({
      ...profile,
      tokens: updatedTokens,
      mixueProgress: updatedMixue,
      lastSavedAt: new Date().toISOString(),
    });

    if (isPrizeTime) {
      setTimeout(() => {
        setIsPrizeModalOpen(true);
      }, 600);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 max-w-4xl mx-auto">
      {/* HEADER CARD: Blooket / Mixue theme banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 border-2 border-rose-400/50 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-rose-950/60">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 border-2 border-rose-300 shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/images/mixue_ice_cream_cup_1791634046839.jpg"
                alt="Mixue Cup"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black font-mono text-[10px] tracking-wider uppercase shadow">
                  BLOOKET QUIZ MODE
                </span>
                <span className="text-amber-300 text-xs font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Turn Angle & Coordinate Mastery
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-white mt-1">
                Mixue Quiz Challenge
              </h1>
              <p className="text-rose-100/90 text-xs sm:text-sm">
                Answer 5 questions correctly to shout <strong className="text-amber-300">MIXUE</strong> to Judge Derrick! 10 shouts = <strong className="text-amber-300">&ldquo;Ur prize!&rdquo;</strong> 🍦
              </p>
            </div>
          </div>

          {/* Player Cup Stats & Available Shouts */}
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/60 border border-rose-400/30 rounded-2xl p-2.5 sm:px-4 sm:py-2.5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Mixue Cups</span>
              <span className="text-lg sm:text-xl font-black text-rose-400 flex items-center gap-1 font-mono">
                🍦 {mixueProgress.cupsWon}
              </span>
            </div>
            <div className="w-px h-8 bg-rose-500/30" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Total Correct</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                {mixueProgress.totalCorrect}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS METERS: 5 Correct -> 1 Shout | 10 Shouts -> "Ur prize!" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-rose-500/30">
          
          {/* Meter 1: Correct answers towards next shout (0 / 5) */}
          <div className="bg-slate-900/80 rounded-2xl p-3 border border-rose-400/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Answers For Shout
              </span>
              <span className="font-black font-mono text-emerald-400">
                {mixueProgress.correctCount} / 5
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300 rounded-full"
                style={{ width: `${(mixueProgress.correctCount / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">
              {mixueProgress.correctCount === 4
                ? '🔥 1 more correct answer to earn a shout!'
                : `${5 - mixueProgress.correctCount} more needed for next Mixue shout`}
            </span>
          </div>

          {/* Meter 2: Shouts given to Derrick towards prize (0 / 10) */}
          <div className="bg-slate-900/80 rounded-2xl p-3 border border-rose-400/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Derrick Shouts For Cup Prize
              </span>
              <span className="font-black font-mono text-amber-400">
                {mixueProgress.shoutsGiven} / 10
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-300 rounded-full"
                style={{ width: `${(mixueProgress.shoutsGiven / 10) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">
              {10 - mixueProgress.shoutsGiven === 0
                ? '🎉 10 shouts reached! Click Ur prize!'
                : `${10 - mixueProgress.shoutsGiven} shouts remaining to win a cup of Mixue!`}
            </span>
          </div>
        </div>

        {/* INTERACTIVE SHOUT BUTTON BAR */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-950/70 border border-rose-400/40 rounded-2xl p-3 sm:px-4">
          <div className="flex items-center gap-2.5 text-xs text-rose-100">
            <span className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-base shadow">
              📣
            </span>
            <div>
              <div className="font-bold text-white">
                Shout Chances Ready: <span className="text-amber-300 font-mono text-sm">{mixueProgress.shoutChancesAvailable}</span>
              </div>
              <div className="text-[11px] text-rose-200/80">
                {mixueProgress.shoutChancesAvailable > 0
                  ? 'Click below to shout MIXUE at Judge Derrick!'
                  : 'Answer 5 questions correctly to earn a shout chance!'}
              </div>
            </div>
          </div>

          <button
            onClick={handleShoutMixue}
            disabled={mixueProgress.shoutChancesAvailable <= 0}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer select-none ${
              mixueProgress.shoutChancesAvailable > 0
                ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-yellow-300 text-slate-950 shadow-rose-900/60 animate-pulse border-2 border-white'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <span>📢 SHOUT MIXUE TO DERRICK!</span>
            {mixueProgress.shoutChancesAvailable > 0 && (
              <span className="px-2 py-0.5 bg-slate-950 text-amber-300 rounded-full font-mono text-xs font-black">
                x{mixueProgress.shoutChancesAvailable}
              </span>
            )}
          </button>
        </div>

        {/* JUDGE DERRICK LIVE QUOTE */}
        <div className="mt-3 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 px-3 flex items-center gap-2.5 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] font-mono shrink-0">
            DERRICK
          </span>
          <p className="text-slate-300 font-medium italic">
            &ldquo;{derrickQuote}&rdquo;
          </p>
        </div>
      </div>

      {/* SHOUT FLOATING ANIMATION OVERLAY */}
      {shoutAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-in zoom-in-50 duration-300">
          <div className="bg-rose-900/90 border-4 border-amber-300 rounded-3xl p-6 sm:p-10 shadow-[0_0_80px_rgba(244,63,94,0.8)] text-center flex flex-col items-center gap-3 backdrop-blur-md">
            <span className="text-5xl sm:text-7xl animate-bounce">🍦📢</span>
            <h2 className="text-4xl sm:text-6xl font-black font-display text-white tracking-wider drop-shadow-[0_4px_16px_rgba(244,63,94,0.8)]">
              M-I-X-U-E !!!
            </h2>
            <p className="text-amber-300 text-base sm:text-xl font-bold font-mono">
              Shouted to Judge Derrick! ({mixueProgress.shoutsGiven}/10)
            </p>
          </div>
        </div>
      )}

      {/* TRACK COORDINATE & MOTION PROFILE VISUALIZER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2 gap-2">
          {/* Reference Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowTrackMap(true);
                setReferenceTab('TURNS');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                showTrackMap && referenceTab === 'TURNS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Turn Map (1-4)</span>
            </button>

            <button
              onClick={() => {
                setShowTrackMap(true);
                setReferenceTab('MOTION');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                showTrackMap && referenceTab === 'MOTION'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Motion Profile (acc, dec, min, max)</span>
            </button>
          </div>

          <button
            onClick={() => setShowTrackMap(!showTrackMap)}
            className="text-[11px] text-slate-400 hover:text-white font-mono cursor-pointer self-end sm:self-center"
          >
            {showTrackMap ? 'Hide Reference ▲' : 'Show Reference ▼'}
          </button>
        </div>

        {showTrackMap && referenceTab === 'TURNS' && (
          <div className="p-4 bg-slate-950/60">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              {/* Turn 1 */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  currentQ.turnNumber === 1
                    ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-400'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-slate-400 uppercase">Top Left</div>
                <div className="text-base font-black text-rose-400 mt-0.5">Turn 1</div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-1">270 degrees</div>
                <div className="text-[10px] text-slate-400 mt-0.5">NW Corner</div>
              </div>

              {/* Turn 2 */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  currentQ.turnNumber === 2
                    ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-400'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-slate-400 uppercase">Top Right</div>
                <div className="text-base font-black text-blue-400 mt-0.5">Turn 2</div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-1">360 degrees</div>
                <div className="text-[10px] text-slate-400 mt-0.5">NE Corner</div>
              </div>

              {/* Turn 3 */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  currentQ.turnNumber === 3
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-slate-400 uppercase">Bottom Right</div>
                <div className="text-base font-black text-emerald-400 mt-0.5">Turn 3</div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-1">90 degrees</div>
                <div className="text-[10px] text-slate-400 mt-0.5">SE Corner</div>
              </div>

              {/* Turn 4 */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  currentQ.turnNumber === 4
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="font-mono font-bold text-[10px] text-slate-400 uppercase">Bottom Left</div>
                <div className="text-base font-black text-amber-400 mt-0.5">Turn 4</div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-1">180 degrees</div>
                <div className="text-[10px] text-slate-400 mt-0.5">SW Corner</div>
              </div>
            </div>
          </div>
        )}

        {showTrackMap && referenceTab === 'MOTION' && (
          <div className="p-4 bg-slate-950/60 flex flex-col gap-3">
            {/* Trapezoidal Motion Range Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-xs font-mono font-bold text-amber-400 mb-2 flex items-center justify-between">
                <span>Trapezoidal Motion Profile Range</span>
                <span className="text-[11px] text-slate-400 font-normal">Full Range = acc + middle + dec</span>
              </div>

              {/* Graphical Range Bar */}
              <div className="grid grid-cols-12 gap-1.5 h-12 text-center text-[10px] font-mono font-bold">
                <div className="col-span-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg flex flex-col items-center justify-center p-1">
                  <span>acc (Start)</span>
                  <span className="text-[9px] text-slate-300 font-normal">Runs min speed</span>
                </div>
                <div className="col-span-6 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-lg flex flex-col items-center justify-center p-1">
                  <span>Middle Range (Cruise)</span>
                  <span className="text-[9px] text-slate-200 font-normal">Runs max speed</span>
                </div>
                <div className="col-span-3 bg-rose-950/80 border border-rose-500/40 text-rose-300 rounded-lg flex flex-col items-center justify-center p-1">
                  <span>dec (End)</span>
                  <span className="text-[9px] text-slate-300 font-normal">Runs min speed</span>
                </div>
              </div>
            </div>

            {/* Definitions & Worked Examples */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                <div className="font-mono font-bold text-emerald-400 mb-1">Definitions:</div>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  <li>• <strong className="text-white">acc:</strong> the front range that run the minimum speed</li>
                  <li>• <strong className="text-white">dec:</strong> the back range that run the minimum speed</li>
                  <li>• <strong className="text-white">min:</strong> the minimum power of the range</li>
                  <li>• <strong className="text-white">max:</strong> the maximum power of the range</li>
                </ul>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                <div className="font-mono font-bold text-amber-400 mb-1">Calculation Rules:</div>
                <ul className="space-y-1 text-slate-300 text-[11px]">
                  <li>• <strong className="text-amber-200">Start (acc range):</strong> speed = <strong>min</strong> power</li>
                  <li>• <strong className="text-amber-200">Middle (cruise range):</strong> speed = <strong>max</strong> power</li>
                  <li>• <strong className="text-amber-200">End (dec range):</strong> speed = <strong>min</strong> power</li>
                  <li>• Example: Range 1200 (acc 100, dec 200) → Middle 900 speed is <strong className="text-emerald-400">100</strong> (max)!</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN BLOOKET QUIZ ARENA */}
      <div className="relative min-h-[420px] bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden">
        
        {/* CASE 1: BLOOKET EXACT CORRECT! SCREEN AS IN USER SCREENSHOT */}
        {quizState === 'CORRECT' && (
          <div
            onClick={advanceToNextQuestion}
            className="absolute inset-0 z-40 bg-white flex flex-col justify-between cursor-pointer select-none animate-in fade-in duration-150 overflow-y-auto"
          >
            {/* 1. TOP SOLID GREEN BANNER WITH "CORRECT" AND FLOATING DOTS */}
            <div className="relative w-full bg-[#22c55e] py-3.5 sm:py-4 px-4 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {/* Confetti dots matching user's screenshot */}
              <div className="absolute top-2 left-1/4 w-3.5 h-3.5 rounded-full bg-emerald-800/40 pointer-events-none" />
              <div className="absolute bottom-1.5 left-[53%] w-3.5 h-3.5 rounded-full bg-[#f97316] pointer-events-none shadow-sm" />
              <div className="absolute top-2 right-1/4 w-3 h-3 rounded-full bg-[#a855f7] pointer-events-none" />
              <div className="absolute bottom-2 right-[14%] w-2.5 h-2.5 rounded-full bg-[#3b82f6] pointer-events-none" />
              <div className="absolute top-2.5 left-[10%] w-2.5 h-2.5 rounded-full bg-yellow-300 pointer-events-none" />

              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-widest uppercase drop-shadow-sm">
                CORRECT
              </h2>
            </div>

            {/* 2. MIDDLE WHITE QUESTION AREA WITH MASCOT + QUESTION + PRESS ANYWHERE TO CONTINUE PILL */}
            <div className="flex-1 bg-white p-4 sm:p-6 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 my-auto">
                {/* Cute Sticker mascot on the left (matching the teddy bears sticker from user's screenshot) */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center drop-shadow-md">
                  <img
                    src="/images/blooket_correct_mascot_1791638882160.jpg"
                    alt="Best Friends Forever Mascot"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Question text on the right */}
                <div className="text-center sm:text-left flex-1 max-w-xl">
                  <h3 className="text-xl sm:text-3xl font-medium font-sans text-slate-800 leading-snug">
                    {currentQ.question}
                  </h3>
                </div>
              </div>

              {/* Exact pill from screenshot: [✔] Press Anywhere to Continue */}
              <div className="mt-4 mb-2 inline-flex items-center gap-2.5 bg-[#f3f4f6] px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm animate-pulse">
                <div className="w-5 h-5 rounded bg-[#22c55e] text-white flex items-center justify-center font-black shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                </div>
                <span className="text-slate-600 font-bold text-sm sm:text-base">
                  Press Anywhere to Continue
                </span>
              </div>
            </div>

            {/* 3. BOTTOM ANSWER TILES GRID (All Green, correct answer in solid vibrant green, others in soft green, with white checkmarks) */}
            <div className="w-full p-2.5 sm:p-4 bg-slate-100/70 border-t border-slate-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {currentQ.options.map((option) => {
                  const isAnswer =
                    option.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
                  return (
                    <div
                      key={option}
                      className={`w-full py-4 sm:py-6 px-4 rounded-xl sm:rounded-2xl font-display font-bold text-base sm:text-xl transition-all flex items-center justify-between text-white shadow-sm ${
                        isAnswer
                          ? 'bg-[#22c55e] shadow-emerald-600/30 ring-2 ring-white/60'
                          : 'bg-[#86efac]'
                      }`}
                    >
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[3.5] shrink-0 ml-1 sm:ml-2" />
                      <span className="flex-1 text-center capitalize px-2 font-bold tracking-wide">
                        {option}
                      </span>
                      <div className="w-5 sm:w-6 shrink-0 mr-1 sm:mr-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CASE 2: WRONG! FEEDBACK OVERLAY (Show correct ans for 3 sec countdown penalty) */}
        {quizState === 'WRONG' && (
          <div className="absolute inset-0 z-40 bg-gradient-to-b from-rose-700 via-rose-800 to-rose-950 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 select-none">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center shadow-2xl mb-4 animate-pulse">
              <XCircle className="w-14 h-14 text-white" />
            </div>

            <h2 className="text-4xl sm:text-6xl font-black font-display text-white tracking-wide drop-shadow-md">
              Wrong! ❌
            </h2>

            {/* Show the correct answer prominently as requested! */}
            <div className="mt-4 bg-slate-950/80 border-2 border-amber-300 rounded-2xl px-6 py-3 max-w-md w-full shadow-xl">
              <div className="text-xs font-mono uppercase text-amber-300 font-bold tracking-wider">
                Correct Answer:
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {currentQ.correctAnswer}
              </div>
            </div>

            {/* 3 Second Countdown Penalty */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-rose-200 text-sm font-bold">
                <Clock className="w-4 h-4 animate-spin text-amber-300" />
                <span>3-Second Penalty Cooldown:</span>
              </div>
              
              <div className="text-3xl sm:text-5xl font-mono font-black text-amber-300 drop-shadow">
                {penaltySeconds > 0 ? `${penaltySeconds}s` : 'READY!'}
              </div>

              {/* Progress bar for 3 second penalty */}
              <div className="w-48 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-rose-400 mt-1">
                <div
                  className="h-full bg-amber-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${((3 - penaltySeconds) / 3) * 100}%` }}
                />
              </div>
            </div>

            {penaltySeconds <= 0 && (
              <button
                onClick={advanceToNextQuestion}
                className="mt-6 px-6 py-3 rounded-2xl bg-white text-rose-950 hover:bg-rose-100 font-black font-display text-sm sm:text-base shadow-xl flex items-center gap-2 cursor-pointer transition-transform active:scale-95 animate-bounce"
              >
                <span>Continue to Next Question</span>
                <ArrowRight className="w-5 h-5 text-rose-700" />
              </button>
            )}
          </div>
        )}

        {/* CASE 3: ACTIVE QUESTION VIEW (Blooket Style) */}
        <div>
          {/* Question Header & Category */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 font-mono font-bold text-amber-400">
                Question {((currentQIndex) % shuffledQuestions.length) + 1} of {shuffledQuestions.length}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">
                {currentQ.category === 'acc_dec'
                  ? 'Motion Range: acc & dec'
                  : currentQ.category === 'min_max'
                  ? 'Power Limits: min & max'
                  : currentQ.category === 'motion_calc'
                  ? 'Motion Range Speed Calculation'
                  : currentQ.category === 'gyro'
                  ? 'Gyroscope Calibration'
                  : currentQ.turnNumber
                  ? `Turn ${currentQ.turnNumber} ${currentQ.category === 'degrees' ? 'Angle' : 'Location'}`
                  : 'Robotics Kinematics'}
              </span>
            </div>

            <button
              onClick={() => {
                advanceToNextQuestion();
              }}
              className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Skip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Big Blooket Question Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-10 text-center shadow-lg my-4">
            <h2 className="text-2xl sm:text-4xl font-black font-display text-white tracking-wide leading-tight">
              {currentQ.question}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-300 font-mono mt-2">
              Choose the correct answer below:
            </p>
          </div>
        </div>

        {/* The 4 Blooket Colorful Answer Tiles (2x2 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-4">
          {currentQ.options.map((option: string, idx: number) => {
            const theme = BLOOKET_COLORS[idx % BLOOKET_COLORS.length];
            return (
              <button
                key={option}
                onClick={() => handleSelectOption(option)}
                className={`w-full py-4 sm:py-6 px-4 rounded-2xl font-display font-black text-base sm:text-xl transition-all cursor-pointer select-none flex items-center justify-between gap-3 text-left ${theme.bg} ${theme.border} ${theme.shadow} ${theme.text}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl">{theme.icon}</span>
                  <span className="capitalize">{option}</span>
                </div>
                <span className="text-xs opacity-75 font-mono uppercase bg-black/20 px-2 py-0.5 rounded-md">
                  [{String.fromCharCode(65 + idx)}]
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info: streak & shout reminder */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Streak: <strong className="text-white font-mono">{mixueProgress.correctCount}/5</strong> to earn shout</span>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-rose-400" />
            <span>Shouts to Derrick: <strong className="text-rose-400 font-mono">{mixueProgress.shoutsGiven}/10</strong> for Mixue cup</span>
          </div>
        </div>
      </div>

      {/* MIXUE PRIZE MODAL (When 10 shouts reached and Derrick says "Ur prize!") */}
      <MixuePrizeModal
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        cupsWon={mixueProgress.cupsWon}
        playerName={profile.name}
        onGoToCourt={onGoToCourt}
      />
    </div>
  );
};
