import React, { useState } from 'react';
import { Bot, Users, X, Play, CheckCircle2, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { TournamentTier } from '../types/game';

interface OpponentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBot: (tierId: string) => void;
  onSelectHuman: (player2Name: string) => void;
  tiers: TournamentTier[];
  selectedTierId: string;
  defaultPlayer2Name?: string;
}

export const OpponentSelectModal: React.FC<OpponentSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectBot,
  onSelectHuman,
  tiers,
  selectedTierId,
  defaultPlayer2Name = 'Blue Duo (Player 2)',
}) => {
  const [mode, setMode] = useState<'bot' | 'human'>('bot');
  const [chosenTierId, setChosenTierId] = useState<string>(selectedTierId);
  const [p2Name, setP2Name] = useState<string>(defaultPlayer2Name);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/derrick_referee_1790948521875.jpg"
              alt="Judge Derrick"
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-400/80 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Judge Derrick Match Setup</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-0.5">
                Choose Opponent: Bot or Human?
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Bot vs Human) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setMode('bot')}
            className={`py-3 px-4 rounded-xl font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mode === 'bot'
                ? 'bg-amber-400 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>PLAY AGAINST BOT (AI)</span>
          </button>

          <button
            onClick={() => setMode('human')}
            className={`py-3 px-4 rounded-xl font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              mode === 'human'
                ? 'bg-cyan-400 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>PLAY AGAINST HUMAN (2P)</span>
          </button>
        </div>

        {/* CONTENT FOR BOT MODE */}
        {mode === 'bot' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-slate-300">
              Select an autonomous WRO AI opponent to challenge in Double Tennis:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map((tier) => {
                const isSelected = tier.id === chosenTierId;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setChosenTierId(tier.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-950 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                        <span className="uppercase">{tier.opponent.difficulty}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <img
                          src={tier.opponent.image}
                          alt={tier.opponent.name}
                          className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate font-display">
                            {tier.opponent.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {tier.opponent.country}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] text-amber-300 font-mono">
                        Speed: {tier.opponent.speed}x · Acc: {Math.round(tier.opponent.shootAccuracy * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
              <div>
                <strong>Player 1 Controls:</strong> Drive with <kbd className="text-amber-300 font-mono">[W][A][S][D]</kbd> · Shoot with <kbd className="text-amber-300 font-mono">[SPACE]</kbd>
              </div>
              <div className="text-amber-400 font-mono text-[11px]">
                Bot plays autonomously on Right Court
              </div>
            </div>

            <button
              onClick={() => onSelectBot(chosenTierId)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-base rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>START MATCH VS BOT</span>
            </button>
          </div>
        )}

        {/* CONTENT FOR HUMAN 2-PLAYER MODE */}
        {mode === 'human' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-slate-300">
              Two human players duel on the same device or keyboard!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Player 1 summary */}
              <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/40 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                    Player 1 (Left Court)
                  </span>
                </div>
                <div className="text-sm font-bold text-white font-display">
                  Team Red Striker
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Movement: <kbd className="px-1 bg-slate-800 rounded text-amber-300 font-mono text-[11px]">W</kbd> <kbd className="px-1 bg-slate-800 rounded text-amber-300 font-mono text-[11px]">A</kbd> <kbd className="px-1 bg-slate-800 rounded text-amber-300 font-mono text-[11px]">S</kbd> <kbd className="px-1 bg-slate-800 rounded text-amber-300 font-mono text-[11px]">D</kbd>
                </div>
                <div className="text-xs text-slate-400">
                  Shoot: <kbd className="px-1.5 bg-slate-800 rounded text-amber-300 font-mono text-[11px]">SPACE</kbd>
                </div>
              </div>

              {/* Player 2 setup */}
              <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/40 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                    Player 2 (Right Court)
                  </span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase">Player 2 Name</label>
                  <input
                    type="text"
                    value={p2Name}
                    maxLength={20}
                    onChange={(e) => setP2Name(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-white font-display font-semibold outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Movement: <kbd className="px-1 bg-slate-800 rounded text-cyan-300 font-mono text-[11px]">Arrow Keys</kbd>
                </div>
                <div className="text-xs text-slate-400">
                  Shoot: <kbd className="px-1.5 bg-slate-800 rounded text-cyan-300 font-mono text-[11px]">ENTER</kbd>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
              💡 <strong>Judge Derrick Reminder:</strong> Both players can also use on-screen D-pads and shoot buttons on touch screens!
            </div>

            <button
              onClick={() => onSelectHuman(p2Name)}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-500 hover:opacity-95 text-slate-950 font-display font-black text-base rounded-xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>START 2-PLAYER HUMAN MATCH</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
