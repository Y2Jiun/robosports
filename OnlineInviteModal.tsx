import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Copy,
  Check,
  Share2,
  Sparkles,
  X,
  Wifi,
  WifiOff,
  Users,
  ArrowRight,
  RefreshCw,
  Send,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  QrCode,
  AlertTriangle,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { onlineService, OnlineState } from '../services/onlineService';
import { sound } from '../services/audioService';

interface OnlineInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  localPlayerName: string;
  onStartOnlineMatch: (isHost: boolean, remotePlayerName: string) => void;
  initialRoomCode?: string;
}

export const OnlineInviteModal: React.FC<OnlineInviteModalProps> = ({
  isOpen,
  onClose,
  localPlayerName,
  onStartOnlineMatch,
  initialRoomCode,
}) => {
  const [tab, setTab] = useState<'HOST' | 'JOIN'>(initialRoomCode ? 'JOIN' : 'HOST');
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>(initialRoomCode || '');
  const [guestNickname, setGuestNickname] = useState<string>('Guest Player');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [onlineState, setOnlineState] = useState<OnlineState>(onlineService.getState());
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);

  // Subscribe to online state updates via multi-subscriber
  useEffect(() => {
    const unsubscribe = onlineService.subscribeState((state) => {
      setOnlineState(state);
      if (state.isConnected && state.remotePlayerName) {
        sound.playWhistle();
      }
    });
    return unsubscribe;
  }, []);

  // When opened in HOST mode, auto-create room if not already open
  useEffect(() => {
    if (isOpen && tab === 'HOST' && !roomCode && !onlineState.isConnected) {
      handleCreateRoom();
    }
  }, [isOpen, tab]);

  // When opened with initialRoomCode, auto-join friend's room immediately!
  useEffect(() => {
    if (initialRoomCode && isOpen) {
      setInputCode(initialRoomCode);
      setTab('JOIN');
      setIsJoining(true);
      setErrorMessage(null);
      onlineService.joinRoom(
        initialRoomCode,
        guestNickname || 'Friend abroad',
        () => {
          setIsJoining(false);
          sound.playWhistle();
          onStartOnlineMatch(false, 'Host');
          onClose();
        },
        (err) => {
          setErrorMessage(err);
          setIsJoining(false);
        }
      );
    }
  }, [initialRoomCode, isOpen]);

  useEffect(() => {
    const unsub = onlineService.subscribeMessage((msg) => {
      if (msg.type === 'START_MATCH') {
        onClose();
      }
    });
    return unsub;
  }, [onClose]);

  const handleCreateRoom = () => {
    setIsCreating(true);
    setErrorMessage(null);
    onlineService.createRoom(
      localPlayerName || 'Host',
      (code) => {
        setRoomCode(code);
        setIsCreating(false);
      },
      (err) => {
        setErrorMessage(err);
        setIsCreating(false);
      }
    );
  };

  const handleJoinRoom = () => {
    const code = inputCode.trim();
    if (!code) {
      setErrorMessage('Please enter a valid room code or paste the invite link');
      return;
    }
    // Extract code if user pasted a full URL
    let parsedCode = code;
    try {
      if (code.includes('?room=')) {
        const url = new URL(code);
        parsedCode = url.searchParams.get('room') || code;
      }
    } catch {}

    setIsJoining(true);
    setErrorMessage(null);
    onlineService.joinRoom(
      parsedCode,
      guestNickname || 'Challenger',
      () => {
        setIsJoining(false);
        sound.playWhistle();
        onStartOnlineMatch(false, onlineService.getState().remotePlayerName || 'Host');
        onClose();
      },
      (err) => {
        setErrorMessage(err);
        setIsJoining(false);
      }
    );
  };

  const inviteUrl = roomCode ? onlineService.getInviteUrl(roomCode) : '';
  const shareMessage = `🎮 Join my WRO RoboSports match in your browser!\n👉 Play with me (no app download & no login needed):\n${inviteUrl}\nOr enter Room Code: ${roomCode}`;
  const qrCodeUrl = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`
    : '';

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const el = document.createElement('textarea');
        el.value = inviteUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopiedLink(true);
      sound.playBooster();
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyShareMessage = async () => {
    if (!inviteUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareMessage);
      }
      setCopiedMessage(true);
      sound.playBooster();
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomCode);
      }
      setCopiedCode(true);
      sound.playBooster();
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleLaunchMatch = () => {
    if (onlineState.isConnected && onlineState.remotePlayerName) {
      onStartOnlineMatch(onlineState.isHost, onlineState.remotePlayerName);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-4 sm:p-5 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400 flex items-center justify-center shadow-lg shrink-0">
              <Globe2 className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-display text-white flex items-center gap-2 flex-wrap">
                <span>Play with Friends Worldwide</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold">
                  NO LOGIN · NO APP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                100% web-based. Your friend can play in any browser without logging in or installing any app!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2.5 sm:p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-center gap-2">
          <button
            onClick={() => setTab('HOST')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'HOST'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>1. Host & Share Public Link</span>
          </button>

          <button
            onClick={() => setTab('JOIN')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'JOIN'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Join Friend's Room</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: HOST */}
          {tab === 'HOST' && (
            <div className="flex flex-col gap-4">
              {/* NO LOGIN & NO APP BANNER */}
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200">
                  <p className="font-bold text-emerald-300 mb-0.5">
                    100% Free Public Web Access — No Account or App Needed!
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Your friend does <strong>NOT</strong> need an app downloaded and does <strong>NOT</strong> need to log in with Google or create an account. They simply click your link or scan the QR code to open the game in Chrome, Safari, Edge, or Firefox on any phone, tablet, or computer.
                  </p>
                </div>
              </div>

              {/* CRITICAL WARNING: DO NOT COPY EDITOR URL */}
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200 leading-snug">
                  <strong>Important Tip:</strong> Do <u>not</u> copy the URL from your browser's top address bar (<code className="text-amber-300 font-mono text-[10px]">aistudio.google.com</code>), because Google will ask your friend to log in! Use the <strong>Direct Public Link</strong> below instead.
                </p>
              </div>

              {/* Room Code & Invite Link Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-300">ROOM CODE:</span>
                  <button
                    onClick={handleCreateRoom}
                    disabled={isCreating}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-bold text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCreating ? 'animate-spin' : ''}`} />
                    <span>New Code</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 font-mono text-lg sm:text-xl font-black text-amber-400 tracking-widest text-center sm:text-left">
                    {roomCode || (isCreating ? 'Generating Room...' : 'Ready')}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    disabled={!roomCode}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Direct Public Web Link (No Login) */}
                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1">
                      <span>DIRECT PUBLIC WEB LINK:</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">
                      ✓ Instant Play · No Login
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      placeholder="Generating public link..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 select-all focus:outline-none overflow-ellipsis"
                    />
                    <button
                      onClick={handleCopyLink}
                      disabled={!roomCode}
                      className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-black shadow-lg transition flex items-center gap-1.5 cursor-pointer font-display shrink-0"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Link Copied!' : 'Copy Public Link'}</span>
                    </button>
                  </div>

                  {/* Secondary Share Actions: WhatsApp + QR Code + Test in Tab */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyShareMessage}
                      disabled={!roomCode}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{copiedMessage ? 'Message Copied!' : 'Copy WhatsApp / Message Text'}</span>
                    </button>

                    <button
                      onClick={() => setShowQrCode(!showQrCode)}
                      disabled={!roomCode}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        showQrCode
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showQrCode ? 'Hide QR Code' : 'Scan Phone QR Code'}</span>
                    </button>

                    {inviteUrl && (
                      <a
                        href={inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                        title="Open in new window to verify no login is required"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Test in New Tab</span>
                      </a>
                    )}
                  </div>

                  {/* QR Code Modal Box */}
                  {showQrCode && qrCodeUrl && (
                    <div className="mt-3 p-4 bg-slate-900 border border-indigo-500/40 rounded-2xl flex flex-col items-center gap-2 text-center animate-in zoom-in-95 duration-150">
                      <div className="bg-white p-3 rounded-2xl shadow-xl">
                        <img
                          src={qrCodeUrl}
                          alt="Room QR Code"
                          className="w-40 h-40 object-contain"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs font-bold text-white mt-1">Scan with any Phone Camera to Join</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Opens directly in Safari or Chrome on iOS and Android. No login or app store download required!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Compatibility Pills */}
              <div className="flex items-center justify-center gap-4 text-slate-400 text-xs py-1">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>iPhone & Android</span>
                </span>
                <span className="flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mac, Windows & Chromebook</span>
                </span>
                <span className="flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>All Browsers</span>
                </span>
              </div>

              {/* Waiting Status / Friend Connected */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {onlineState.isConnected ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                      <Wifi className="w-5 h-5 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
                      <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-2">
                      <span>{onlineState.isConnected ? 'FRIEND CONNECTED!' : 'WAITING FOR FRIEND...'}</span>
                      {onlineState.pingMs !== null && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {onlineState.pingMs}ms latency
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {onlineState.isConnected
                        ? `Playing with ${onlineState.remotePlayerName || 'Friend abroad'} (Team 2 Blue Robot)`
                        : 'Send link to your friend. Match connects automatically when they open it in their browser.'}
                    </p>
                  </div>
                </div>

                {onlineState.isConnected && (
                  <button
                    onClick={handleLaunchMatch}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer animate-bounce font-display shrink-0"
                  >
                    <span>PLAY MATCH NOW</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: JOIN */}
          {tab === 'JOIN' && (
            <div className="flex flex-col gap-4">
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                <Globe2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-cyan-200">
                  <p className="font-bold text-white mb-0.5">Joining a Friend's Match?</p>
                  Paste the Room Code or public link sent by your friend. No account, login, or installation required!
                </div>
              </div>

              {/* Guest Nickname Input */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-300">YOUR GUEST NICKNAME (NO ACCOUNT NEEDED):</label>
                <input
                  type="text"
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value)}
                  placeholder="e.g. Alex, Sam, RoboGuest..."
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />

                <label className="text-xs font-bold text-slate-300 mt-1">ENTER ROOM CODE OR PASTE INVITE LINK:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. WRO-7821 or paste public link..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={isJoining || !inputCode.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer font-display shrink-0"
                  >
                    {isJoining ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Join Friend</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status if Connected */}
              {onlineState.isConnected && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                      <Wifi className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">CONNECTED TO HOST!</div>
                      <p className="text-[11px] text-emerald-300">
                        Playing as Team 2 against {onlineState.remotePlayerName || 'Host'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLaunchMatch}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer font-display shrink-0"
                  >
                    <span>ENTER MATCH</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="font-mono text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Public Peer-to-Peer · No Login or Registration Required</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
