import React, { useState } from 'react';
import { Save, Download, Upload, RotateCcw, Check, Sparkles, X, User, Trophy, Shield, Cpu } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { storage } from '../services/storageService';

interface ProgressSaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: PlayerProfile[];
  activeSlotId: string;
  onSelectSlot: (slotId: string) => void;
  onUpdateProfile: (profile: PlayerProfile) => void;
  onResetSlot: (slotId: string) => void;
}

export const ProgressSaverModal: React.FC<ProgressSaverModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeSlotId,
  onSelectSlot,
  onUpdateProfile,
  onResetSlot,
}) => {
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen) return null;

  const handleManualSave = () => {
    profiles.forEach((p) => storage.saveProfile(p));
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  const handleExportData = () => {
    const json = storage.exportAllData();
    navigator.clipboard.writeText(json).then(() => {
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 2500);
    }).catch(() => {
      // Fallback download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wro_robosports_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleExecuteImport = () => {
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError('Please paste valid JSON save data.');
      return;
    }
    const success = storage.importAllData(importJsonText);
    if (success) {
      window.location.reload();
    } else {
      setImportError('Invalid save data format. Please verify the JSON string.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-amber-400/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col gap-5 my-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-black">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white flex items-center gap-2">
                <span>PROGRESS SAVER & PLAYER SLOTS</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono uppercase">
                  Auto-Save Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Independent saves & screens for up to 3 players on the same website. Choose to save 1 or 2 Purple Balls in your Vault Safe!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK TOAST */}
        {saveSuccessNotice && (
          <div className="bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>All 3 player profiles and court game progress safely saved to local storage!</span>
          </div>
        )}

        {copiedNotice && (
          <div className="bg-cyan-500/20 border border-cyan-500/60 text-cyan-300 text-xs px-3 py-2 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Complete save backup copied to clipboard! You can paste it into any device.</span>
          </div>
        )}

        {/* 3 PLAYER PROFILES CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {profiles.map((profile) => {
            const isActive = profile.id === activeSlotId;

            return (
              <div
                key={profile.id}
                className={`relative rounded-2xl p-4 flex flex-col gap-3 transition-all border-2 ${
                  isActive
                    ? 'bg-slate-950/95 border-amber-400 ring-4 ring-amber-400/30 shadow-xl scale-[1.01]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Active Slot Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md uppercase"
                    style={{ backgroundColor: `${profile.color}25`, color: profile.color, border: `1px solid ${profile.color}60` }}
                  >
                    SCREEN / SLOT #{profile.slotNumber}
                  </span>

                  {isActive && (
                    <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                      ACTIVE SCREEN
                    </span>
                  )}
                </div>

                {/* Profile Name & Tagline */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border-2 shadow-md shrink-0"
                    style={{ borderColor: profile.color, backgroundColor: `${profile.color}20` }}
                  >
                    <User className="w-6 h-6" style={{ color: profile.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => {
                        onUpdateProfile({ ...profile, name: e.target.value });
                      }}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-white focus:outline-none focus:border-amber-400 font-display"
                      placeholder={`Player ${profile.slotNumber}`}
                    />
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {profile.tagline}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Tokens: <strong className="text-amber-400 font-mono">{profile.tokens}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>W/L: <strong className="text-white font-mono">{profile.stats.wins}W - {profile.stats.losses}L</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Motor: <strong className="text-cyan-300 font-mono">Lv.{profile.robot.motorLevel}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Purple Saves: <strong className="text-purple-300 font-mono">{profile.stats.purpleBallsSecuredTotal}</strong></span>
                  </div>
                </div>

                {/* OFFICIAL RULE: 1 PURPLE BALL PER SIDE (TOTAL 2 ONLY) */}
                <div className="bg-slate-900/80 border border-purple-500/40 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-purple-300 text-[11px] flex items-center gap-1">
                      <span>🟣 VAULT LOCK RULE:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      1 Purple Ball per side (total 2 balls)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-500/30">
                    -2 Marks Locked
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-1">
                  {!isActive ? (
                    <button
                      onClick={() => onSelectSlot(profile.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all shadow cursor-pointer font-display"
                    >
                      SWITCH TO THIS PLAYER
                    </button>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-emerald-400 font-bold text-xs text-center border border-emerald-500/30">
                      ACTIVE ON SCREEN
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Reset progress for ${profile.name}? This will restore default stats.`)) {
                        onResetSlot(profile.id);
                      }
                    }}
                    title="Reset Slot"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-display"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE ALL PROGRESS NOW</span>
            </button>

            <button
              onClick={handleExportData}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXPORT BACKUP</span>
            </button>

            <button
              onClick={() => setShowImportBox(!showImportBox)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>IMPORT BACKUP</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Close & Play
          </button>
        </div>

        {/* IMPORT BACKUP JSON DRAWER */}
        {showImportBox && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">Paste JSON Backup Data:</label>
            <textarea
              rows={3}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='Paste exported {"version":1, "profiles": [...]} JSON string here'
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
            />
            {importError && (
              <span className="text-xs text-rose-400">{importError}</span>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportBox(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteImport}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer shadow"
              >
                Restore & Reload Profiles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
