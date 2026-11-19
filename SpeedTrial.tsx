import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Timer, Award, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { SpeedTrialRecord } from '../types/game';
import { sound } from '../services/audioService';

interface SpeedTrialProps {
  onRecordSaved: (record: SpeedTrialRecord) => void;
  bestRecord?: SpeedTrialRecord | null;
}

export const SpeedTrial: React.FC<SpeedTrialProps> = ({
  onRecordSaved,
  bestRecord,
}) => {
  const [trialState, setTrialState] = useState<'IDLE' | 'COUNTDOWN' | 'RUNNING' | 'FINISHED'>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15.0);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [currentCps, setCurrentCps] = useState(0);
  const [peakCps, setPeakCps] = useState(0);
  const [latestRecord, setLatestRecord] = useState<SpeedTrialRecord | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishHandledRef = useRef(false);

  // Start trial sequence
  const startTrial = () => {
    setTrialState('COUNTDOWN');
    setCountdown(3);
    setTapCount(0);
    setTapTimestamps([]);
    setCurrentCps(0);
    setPeakCps(0);
    setTimeLeft(15.0);
    setLatestRecord(null);
    finishHandledRef.current = false;
    sound.playCountdown(false);
  };

  // Countdown timer logic
  useEffect(() => {
    if (trialState !== 'COUNTDOWN') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTrialState('RUNNING');
          sound.playCountdown(true);
          sound.playWhistle();
          return 0;
        }
        sound.playCountdown(false);
        return prev - 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [trialState]);

  // Handle finish
  const finishTrial = useCallback((finalTaps: number, maxCps: number) => {
    if (finishHandledRef.current) return;
    finishHandledRef.current = true;

    sound.playWhistle(true);
    sound.playGoalHorn();

    const avgCps = +(finalTaps / 15.0).toFixed(2);
    let badge: SpeedTrialRecord['badge'] = 'Bronze';
    let commentary = "Fair speed, roboteer! Practice your rhythm on the test bench.";

    if (avgCps >= 10.5) {
      badge = 'Diamond';
      commentary = "UNBELIEVABLE! You have the fastest robotic trigger fingers in WRO history!";
    } else if (avgCps >= 8.0) {
      badge = 'Gold';
      commentary = "World-Class speed! Judge Derrick officially certifies you for international competition!";
    } else if (avgCps >= 6.0) {
      badge = 'Silver';
      commentary = "Solid competitive velocity! You'll give the best teams a run for their money.";
    }

    const record: SpeedTrialRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      duration: 15,
      totalTaps: finalTaps,
      averageCps: avgCps,
      peakCps: +maxCps.toFixed(2),
      derrickCertification: commentary,
      badge,
    };

    setLatestRecord(record);
    setTrialState('FINISHED');
    onRecordSaved(record);
  }, [onRecordSaved]);

  // Active run loop (100ms ticker)
  useEffect(() => {
    if (trialState !== 'RUNNING') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, +(prev - 0.1).toFixed(1));
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trialState]);

  // Detect time runout
  useEffect(() => {
    if (trialState === 'RUNNING' && timeLeft <= 0) {
      finishTrial(tapCount, peakCps);
    }
  }, [timeLeft, trialState, tapCount, peakCps, finishTrial]);

  // Tap handler
  const handleTap = useCallback(() => {
    if (trialState !== 'RUNNING') return;

    const now = Date.now();
    sound.playTap(true, currentCps > 8);

    setTapCount((prev) => prev + 1);
    setTapTimestamps((prev) => {
      const updated = [...prev, now];
      // Keep stamps from last 1.5s
      const windowStart = now - 1500;
      const recent = updated.filter((t) => t >= windowStart);
      const calculatedCps = (recent.length / 1.5);
      setCurrentCps(calculatedCps);
      setPeakCps((max) => Math.max(max, calculatedCps));
      return recent;
    });
  }, [trialState, currentCps]);

  // Keyboard tap support for Speed Trial
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      if (['Space', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL'].includes(e.code)) {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleTap]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              WRO OFFICIAL SPEED LAB
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white mt-1">
            Judge Derrick's 15-Second Speed Dyno
          </h2>
          <p className="text-sm text-slate-400">
            Push your finger velocity to the absolute maximum. Derrick measures your CPS and issues an official rank.
          </p>
        </div>

        {bestRecord && (
          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Personal Record</div>
              <div className="text-sm font-black text-amber-300 font-mono-nums">
                {bestRecord.averageCps} Avg CPS · {bestRecord.badge}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dyno Bench / Live Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Time Left */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-xs font-mono text-slate-400 uppercase">Clock Remaining</div>
          <div className={`text-4xl font-black font-mono-nums mt-1 ${timeLeft <= 3 && trialState === 'RUNNING' ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
            {timeLeft.toFixed(1)}s
          </div>
        </div>

        {/* Metric 2: Current CPS */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-xs font-mono text-slate-400 uppercase">Live Speed</div>
          <div className="text-4xl font-black text-amber-400 font-mono-nums mt-1">
            {currentCps.toFixed(1)} <span className="text-lg text-slate-400">CPS</span>
          </div>
        </div>

        {/* Metric 3: Total Taps */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
          <div className="text-xs font-mono text-slate-400 uppercase">Total Clicks</div>
          <div className="text-4xl font-black text-cyan-400 font-mono-nums mt-1">
            {tapCount}
          </div>
        </div>
      </div>

      {/* MAIN INTERACTIVE BENCH */}
      {trialState === 'IDLE' && (
        <div className="py-12 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-amber-400 fill-amber-400" />
          </div>
          <h3 className="text-xl font-bold font-display text-white">
            Ready to Calibrate on Derrick's Dyno?
          </h3>
          <p className="text-sm text-slate-400 max-w-md mt-1 mb-6">
            You will have 15 seconds to tap as fast as humanly possible. Judge Derrick will monitor every single tap timestamp.
          </p>
          <button
            onClick={startTrial}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-black text-lg rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            START 15-SECOND SPRINT
          </button>
        </div>
      )}

      {trialState === 'COUNTDOWN' && (
        <div className="py-16 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="text-8xl font-black font-display text-amber-400 animate-bounce">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-2 uppercase tracking-widest">
            Hands on the sensor pad...
          </p>
        </div>
      )}

      {trialState === 'RUNNING' && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleTap}
            className="tap-zone w-full py-16 sm:py-20 rounded-2xl bg-gradient-to-b from-amber-400 via-amber-500 to-red-600 hover:from-amber-300 hover:to-red-500 text-slate-950 font-display font-black text-3xl sm:text-5xl shadow-2xl active:scale-95 cursor-pointer border-4 border-amber-300 transition-transform flex flex-col items-center justify-center gap-2 select-none"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-10 h-10 fill-slate-950" />
              <span>TAP! TAP! TAP!</span>
            </div>
            <span className="text-sm font-sans font-bold text-slate-900/80">
              Or mash [SPACE] / [A] / [S] / [D] / [L]
            </span>
          </button>
        </div>
      )}

      {trialState === 'FINISHED' && latestRecord && (
        <div className="bg-slate-950 border-2 border-amber-400/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center">
                <Award className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                  OFFICIAL SPEED CERTIFICATE
                </span>
                <h3 className="text-2xl font-bold font-display text-white">
                  Rank Award: {latestRecord.badge} Division
                </h3>
              </div>
            </div>

            <button
              onClick={startTrial}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retest Speed</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Average Speed</div>
              <div className="text-2xl font-black text-amber-400 font-mono-nums">
                {latestRecord.averageCps} CPS
              </div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Peak Burst</div>
              <div className="text-2xl font-black text-rose-400 font-mono-nums">
                {latestRecord.peakCps} CPS
              </div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Total Taps</div>
              <div className="text-2xl font-black text-cyan-400 font-mono-nums">
                {latestRecord.totalTaps}
              </div>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Duration</div>
              <div className="text-2xl font-black text-slate-200 font-mono-nums">
                15.0s
              </div>
            </div>
          </div>

          {/* Derrick's Certificate Note */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300 font-display">
                Judge Derrick's Official Verdict:
              </div>
              <p className="text-sm text-slate-200 italic mt-0.5">
                "{latestRecord.derrickCertification}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
