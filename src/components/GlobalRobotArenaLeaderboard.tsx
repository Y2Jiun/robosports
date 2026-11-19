import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Search,
  Zap,
  Flame,
  Shield,
  Bot,
  Globe2,
  TrendingUp,
  Award,
} from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { storage } from '../services/storageService';

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  name: string;
  team: string;
  country: string;
  flag: string;
  robotName: string;
  robotImage: string;
  tokens: number;
  tournamentWins: number;
  stageReached: string;
  isChampion: boolean;
  isCurrentPlayer?: boolean;
}

const GLOBAL_BASE_COMPETITORS: Omit<LeaderboardEntry, 'rank' | 'isCurrentPlayer'>[] = [
  {
    id: 'taiwan_formosa',
    name: 'Team Taiwan',
    team: 'Formosa Striker TWN',
    country: 'Taiwan',
    flag: '🇹🇼',
    robotName: 'Formosa Striker S3',
    robotImage: '/images/taiwan_robot_champion_1791590774691.jpg',
    tokens: 2850,
    tournamentWins: 18,
    stageReached: 'Grand Finals (World Champ)',
    isChampion: true,
  },
  {
    id: 'usa_dynasty',
    name: 'Dynasty Robotics',
    team: 'Apex Titan WRO',
    country: 'United States',
    flag: '🇺🇸',
    robotName: 'Apex Titan v4',
    robotImage: '/images/rival_robot_1790947986992.jpg',
    tokens: 2420,
    tournamentWins: 14,
    stageReached: 'Stage 3 Finalist',
    isChampion: false,
  },
  {
    id: 'japan_cyber',
    name: 'Neon Circuit',
    team: 'CyberClaw S2',
    country: 'Japan',
    flag: '🇯🇵',
    robotName: 'CyberClaw S2',
    robotImage: '/images/rival_robot_1790947986992.jpg',
    tokens: 2150,
    tournamentWins: 12,
    stageReached: 'Stage 2 National Champ',
    isChampion: false,
  },
  {
    id: 'germany_quantum',
    name: 'Quantum Dynamics',
    team: 'Apex Dynamo DE',
    country: 'Germany',
    flag: '🇩🇪',
    robotName: 'Apex Dynamo Mark II',
    robotImage: '/images/player_robot_1790947974702.jpg',
    tokens: 1890,
    tournamentWins: 10,
    stageReached: 'Stage 2 Finalist',
    isChampion: false,
  },
  {
    id: 'singapore_merlion',
    name: 'Merlion Botics',
    team: 'Sentosa Blitz',
    country: 'Singapore',
    flag: '🇸🇬',
    robotName: 'Sentosa Blitz X',
    robotImage: '/images/player_robot_1790947974702.jpg',
    tokens: 1620,
    tournamentWins: 8,
    stageReached: 'Stage 2 Semifinals',
    isChampion: false,
  },
  {
    id: 'korea_neon',
    name: 'Seoul RoboWorks',
    team: 'Han River Strikers',
    country: 'South Korea',
    flag: '🇰🇷',
    robotName: 'K-Hyper Mech',
    robotImage: '/images/rival_robot_1790947986992.jpg',
    tokens: 1380,
    tournamentWins: 7,
    stageReached: 'Stage 2 Qualifier',
    isChampion: false,
  },
  {
    id: 'sweden_nordic',
    name: 'Nordic Robotics',
    team: 'Viking Mech S1',
    country: 'Sweden',
    flag: '🇸🇪',
    robotName: 'Viking Mech',
    robotImage: '/images/player_robot_1790947974702.jpg',
    tokens: 1150,
    tournamentWins: 6,
    stageReached: 'Stage 1 Regional Cleared',
    isChampion: false,
  },
  {
    id: 'uk_britannia',
    name: 'Albion Engineering',
    team: 'Britannia Core',
    country: 'United Kingdom',
    flag: '🇬🇧',
    robotName: 'Britannia Striker',
    robotImage: '/images/rival_robot_1790947986992.jpg',
    tokens: 880,
    tournamentWins: 4,
    stageReached: 'Stage 1 Regional',
    isChampion: false,
  },
  {
    id: 'canada_maple',
    name: 'Maple Kinetic',
    team: 'Ontario Bots',
    country: 'Canada',
    flag: '🇨🇦',
    robotName: 'Northern Lynx',
    robotImage: '/images/player_robot_1790947974702.jpg',
    tokens: 650,
    tournamentWins: 3,
    stageReached: 'Stage 1 Regional',
    isChampion: false,
  },
  {
    id: 'australia_outback',
    name: 'Aussie Mech Lab',
    team: 'Boomerang Tech',
    country: 'Australia',
    flag: '🇦🇺',
    robotName: 'Boomerang V1',
    robotImage: '/images/rival_robot_1790947986992.jpg',
    tokens: 420,
    tournamentWins: 2,
    stageReached: 'Stage 1 Rookie',
    isChampion: false,
  },
];

interface GlobalRobotArenaLeaderboardProps {
  currentProfile: PlayerProfile;
}

export const GlobalRobotArenaLeaderboard: React.FC<GlobalRobotArenaLeaderboardProps> = ({
  currentProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CHAMPIONS' | 'TOP_5'>('ALL');

  // Compute live ranking table including all player slots from storage & active player
  const leaderboardData = useMemo(() => {
    // 1. Get other profiles
    const allProfiles = storage.getAllProfiles();

    // 2. Map user profiles to entries
    const userEntries: LeaderboardEntry[] = allProfiles.map((p) => {
      // If this is the active slot, use current live profile props
      const prof = p.id === currentProfile.id ? currentProfile : p;
      const prog = prof.tournamentProgress;
      const isChamp = prog?.isChampion || false;
      const stageName = isChamp
        ? '🏆 Grand Finals Champion'
        : prog?.currentStage === 3
        ? 'Stage 3 (Grand Finals vs Taiwan)'
        : prog?.currentStage === 2
        ? `Stage 2 (${prog.stage2Wins || 0}/5 Wins)`
        : `Stage 1 (${prog?.stage1Wins || 0}/5 Wins)`;

      return {
        id: `player_${prof.id}`,
        name: prof.name || 'Robo Pilot',
        team: prof.robot.team || 'Challenger Club',
        country: prof.robot.country || 'Global Circuit',
        flag: prof.robot.country === 'Japan' ? '🇯🇵' : prof.robot.country === 'Germany' ? '🇩🇪' : '🏁',
        robotName: prof.robot.name,
        robotImage: prof.robot.image || '/images/player_robot_1790947974702.jpg',
        tokens: prof.tokens,
        tournamentWins:
          (prog?.stage1Wins || 0) + (prog?.stage2Wins || 0) + (prog?.stage3Wins || 0) + (prof.stats.wins || 0),
        stageReached: stageName,
        isChampion: isChamp,
        isCurrentPlayer: prof.id === currentProfile.id,
      };
    });

    // 3. Combine with global base competitors
    const combined: LeaderboardEntry[] = [...GLOBAL_BASE_COMPETITORS, ...userEntries];

    // 4. Sort descending by total tournament tokens!
    combined.sort((a, b) => b.tokens - a.tokens);

    // 5. Assign 1-indexed ranks
    return combined.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }, [currentProfile]);

  // Find active player's current rank
  const playerEntry = leaderboardData.find((entry) => entry.isCurrentPlayer);
  const playerRank = playerEntry?.rank || 1;

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return leaderboardData.filter((entry) => {
      if (filterType === 'CHAMPIONS' && !entry.isChampion) return false;
      if (filterType === 'TOP_5' && (entry.rank || 0) > 5) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          entry.name.toLowerCase().includes(query) ||
          entry.team.toLowerCase().includes(query) ||
          entry.country.toLowerCase().includes(query) ||
          entry.robotName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [leaderboardData, filterType, searchQuery]);

  // Podium top 3
  const topThree = leaderboardData.slice(0, 3);

  return (
    <div className="w-full bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide">
                Global Robot Arena Leaderboard
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 font-mono text-[10px] font-black tracking-wider uppercase">
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Official World Rankings · Ranked by Total Tournament Tokens & Trophy Points
            </p>
          </div>
        </div>

        {/* CURRENT PLAYER STANDING BADGE */}
        {playerEntry && (
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/60 border border-amber-400/40 rounded-2xl p-3 px-4 flex items-center gap-3 shadow">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Your Rank</span>
              <span className="text-xl font-black font-mono text-amber-400 flex items-center gap-0.5">
                #{playerRank}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{playerEntry.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded font-black font-mono">
                  YOU
                </span>
              </span>
              <span className="text-xs font-mono font-black text-amber-300 flex items-center gap-1">
                🪙 {playerEntry.tokens} Tournament Tokens
              </span>
            </div>
          </div>
        )}
      </div>

      {/* TOP 3 PODIUM DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
        {topThree.map((entry, index) => {
          const isGold = index === 0;
          const isSilver = index === 1;
          const isBronze = index === 2;

          return (
            <div
              key={entry.id}
              className={`relative overflow-hidden rounded-2xl p-4 border flex flex-col justify-between transition-transform hover:scale-101 ${
                isGold
                  ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                  : isSilver
                  ? 'bg-gradient-to-b from-slate-800/40 via-slate-900 to-slate-950 border-slate-400 shadow-md ring-1 ring-slate-400/30'
                  : 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border-amber-700/60 shadow-md ring-1 ring-amber-700/30'
              }`}
            >
              {/* Podium Rank Label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isGold && <Crown className="w-5 h-5 text-amber-400 animate-pulse" />}
                  {isSilver && <Medal className="w-5 h-5 text-slate-300" />}
                  {isBronze && <Medal className="w-5 h-5 text-amber-600" />}
                  <span
                    className={`font-mono font-black text-sm ${
                      isGold ? 'text-amber-300' : isSilver ? 'text-slate-200' : 'text-amber-500'
                    }`}
                  >
                    #{entry.rank} {isGold ? 'WORLD CHAMPION' : isSilver ? 'RUNNER UP' : '3RD PLACE'}
                  </span>
                </div>
                <span className="text-lg">{entry.flag}</span>
              </div>

              {/* Bot & Pilot Info */}
              <div className="flex items-center gap-3 my-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                  <img
                    src={entry.robotImage}
                    alt={entry.robotName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-black text-white text-base truncate flex items-center gap-1.5">
                    <span>{entry.name}</span>
                    {entry.isCurrentPlayer && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black font-mono">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {entry.team} · {entry.country}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate mt-0.5">
                    {entry.robotName}
                  </div>
                </div>
              </div>

              {/* Tokens & Stage */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate">{entry.stageReached}</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  🪙 {entry.tokens} PTS
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pilots, teams, countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Competitors ({leaderboardData.length})
          </button>
          <button
            onClick={() => setFilterType('CHAMPIONS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'CHAMPIONS'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Champions</span>
          </button>
          <button
            onClick={() => setFilterType('TOP_5')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterType === 'TOP_5'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Top 5
          </button>
        </div>
      </div>

      {/* FULL LEADERBOARD TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 sm:px-4">Rank</th>
              <th className="py-3 px-3 sm:px-4">Pilot & Team</th>
              <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Robot Model</th>
              <th className="py-3 px-3 sm:px-4">Tournament Stage</th>
              <th className="py-3 px-3 sm:px-4 text-right">Total Tokens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredEntries.map((entry) => {
              const isTop3 = (entry.rank || 0) <= 3;
              const isMe = entry.isCurrentPlayer;

              return (
                <tr
                  key={entry.id}
                  className={`transition-colors ${
                    isMe
                      ? 'bg-amber-500/15 hover:bg-amber-500/20 ring-1 ring-inset ring-amber-400/50'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {entry.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black font-mono flex items-center justify-center text-xs shadow">
                          1
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black font-mono flex items-center justify-center text-xs shadow">
                          2
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-600 text-slate-950 font-black font-mono flex items-center justify-center text-xs shadow">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400 font-bold ml-1">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Pilot & Team */}
                  <td className="py-3 px-3 sm:px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                        <img
                          src={entry.robotImage}
                          alt={entry.robotName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="truncate">{entry.name}</span>
                          <span className="text-xs">{entry.flag}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-mono text-[9px] font-black uppercase">
                              YOU
                            </span>
                          )}
                          {entry.isChampion && (
                            <span title="Grand Finals Champion">
                              <Crown className="w-3.5 h-3.5 text-amber-400 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {entry.team} · {entry.country}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Robot Model */}
                  <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                    <span className="font-mono text-cyan-400 text-xs">
                      {entry.robotName}
                    </span>
                  </td>

                  {/* Stage Reached */}
                  <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        entry.isChampion
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {entry.stageReached}
                    </span>
                  </td>

                  {/* Total Tokens */}
                  <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                    <span className="font-mono font-black text-amber-300 text-sm flex items-center justify-end gap-1">
                      🪙 {entry.tokens.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER NOTICE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tokens are awarded for Tournament Wins, Clearing Stages, and Answering Quiz Questions!</span>
        </div>
        <div className="font-mono text-slate-500">
          Rankings update dynamically in real time
        </div>
      </div>
    </div>
  );
};
