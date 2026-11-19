import React from 'react';
import { Cpu, Zap, ShieldCheck, Wrench, CheckCircle2 } from 'lucide-react';
import { RobotStats } from '../types/game';

interface RobotCustomizerProps {
  robot: RobotStats;
  tokens: number;
  onUpgrade: (type: 'motor' | 'overdrive' | 'cooling', cost: number) => void;
  onUpdateInfo: (name: string, team: string) => void;
}

export const RobotCustomizer: React.FC<RobotCustomizerProps> = ({
  robot,
  tokens,
  onUpgrade,
  onUpdateInfo,
}) => {
  const motorCost = (robot.motorLevel + 1) * 120;
  const overdriveCost = Math.round(robot.overdriveChargeRate * 180);
  const coolingCost = Math.round(robot.coolingEfficiency * 150);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              WRO PADDOCK WORKSHOP
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
            Robot Calibration & Inspection Paddock
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Tune your robot's motor actuators and capacitors to boost tap speed in the arena.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono text-slate-400 uppercase">Available:</span>
          <span className="text-base font-black text-amber-400 font-mono-nums">{tokens} PTS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROBOT PREVIEW & CERTIFICATE */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
          <div className="relative w-36 h-36 rounded-2xl p-1 bg-gradient-to-br from-rose-500 via-amber-500 to-rose-700 shadow-xl mb-4">
            <img
              src={robot.image}
              alt={robot.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute -bottom-2 inset-x-2 bg-slate-950/90 border border-amber-400/50 rounded text-[10px] font-mono text-amber-300 py-0.5">
              MOTOR LVL {robot.motorLevel}
            </div>
          </div>

          <div className="w-full text-left space-y-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">Robot Name</label>
              <input
                type="text"
                value={robot.name}
                maxLength={20}
                onChange={(e) => onUpdateInfo(e.target.value, robot.team)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-1.5 text-sm text-white font-display font-semibold outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">RoboSports Team</label>
              <input
                type="text"
                value={robot.team}
                maxLength={25}
                onChange={(e) => onUpdateInfo(robot.name, e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* Derrick's Certificate Stamp */}
          <div className="w-full mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300">
                WRO Certified Pass
              </div>
              <div className="text-[10px] text-slate-400">
                Inspected by Judge Derrick · Legal for Competition
              </div>
            </div>
          </div>
        </div>

        {/* UPGRADE ACTUATORS & COMPONENTS */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase font-mono tracking-wider">
            Hardware Upgrades
          </h3>

          {/* Upgrade 1: Motor Torque */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">
                  Dual High-Torque Servo Gearbox
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Increases puck push distance with each finger tap.
                </p>
                <div className="text-xs text-rose-400 font-mono-nums mt-1 font-semibold">
                  Current Level: {robot.motorLevel} ({(robot.motorLevel * 15)}% bonus push)
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpgrade('motor', motorCost)}
              disabled={tokens < motorCost}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 font-display ${
                tokens >= motorCost
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              UPGRADE ({motorCost} PTS)
            </button>
          </div>

          {/* Upgrade 2: Overdrive Capacitor */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">
                  Turbo Resonator Capacitor
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Overdrive frenzy builds up faster during rapid taps.
                </p>
                <div className="text-xs text-amber-400 font-mono-nums mt-1 font-semibold">
                  Charge Rate: {robot.overdriveChargeRate.toFixed(1)}x multiplier
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpgrade('overdrive', overdriveCost)}
              disabled={tokens < overdriveCost}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 font-display ${
                tokens >= overdriveCost
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              UPGRADE ({overdriveCost} PTS)
            </button>
          </div>

          {/* Upgrade 3: Liquid Cooling */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">
                  Thermal Heat-Sink Fans
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Extends Turbo Overdrive state duration by reducing motor overheat.
                </p>
                <div className="text-xs text-cyan-400 font-mono-nums mt-1 font-semibold">
                  Thermal Efficiency: {robot.coolingEfficiency.toFixed(1)}x
                </div>
              </div>
            </div>

            <button
              onClick={() => onUpgrade('cooling', coolingCost)}
              disabled={tokens < coolingCost}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 font-display ${
                tokens >= coolingCost
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              UPGRADE ({coolingCost} PTS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
