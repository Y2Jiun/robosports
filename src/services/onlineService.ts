import Peer, { DataConnection } from 'peerjs';
import { CourtRobot, TennisBall, VaultBox, KeyItem, MatchScore, MatchStage } from '../types/game';

export interface OnlineSyncPayload {
  balls: TennisBall[];
  robot1: CourtRobot;
  robot2?: CourtRobot;
  score: MatchScore;
  team1Vault: VaultBox;
  team2Vault: VaultBox;
  team1Key: KeyItem;
  team2Key: KeyItem;
  matchStage: MatchStage;
  timeRemaining: number;
}

export interface OnlineMessage {
  type:
    | 'JOIN'
    | 'JOIN_ACK'
    | 'SYNC_STATE'
    | 'INPUT_P2'
    | 'SHOOT_P2'
    | 'CHARGE_P2'
    | 'CHARGE_CANCEL_P2'
    | 'EMOTE'
    | 'RESTART'
    | 'START_MATCH'
    | 'COUNTDOWN_STEP'
    | 'RESTART_REQUEST'
    | 'PING'
    | 'PONG';
  payload?: any;
  timestamp?: number;
}

export interface OnlineState {
  isConnected: boolean;
  isHost: boolean;
  roomId: string | null;
  remotePlayerName: string | null;
  remoteCountry?: string;
  pingMs: number | null;
  statusText: string;
}

// Global low-latency public STUN servers for cross-country WebRTC peer connection
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

type StateCallback = (state: OnlineState) => void;
type MessageCallback = (msg: OnlineMessage) => void;

export class OnlineManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private isHost: boolean = false;
  private roomId: string | null = null;
  private remotePlayerName: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private currentPing: number | null = null;

  // Support multiple subscribers so RoboGameStation and Modals don't overwrite each other
  private stateListeners: Set<StateCallback> = new Set();
  private messageListeners: Set<MessageCallback> = new Set();

  public set onStateChange(cb: StateCallback | undefined) {
    if (cb) {
      this.stateListeners.add(cb);
    }
  }

  public set onMessage(cb: MessageCallback | undefined) {
    if (cb) {
      this.messageListeners.add(cb);
    }
  }

  public subscribeState(cb: StateCallback): () => void {
    this.stateListeners.add(cb);
    // Emit immediate current state
    cb(this.getState());
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  public subscribeMessage(cb: MessageCallback): () => void {
    this.messageListeners.add(cb);
    return () => {
      this.messageListeners.delete(cb);
    };
  }

  public getState(): OnlineState {
    return {
      isConnected: !!this.connection && this.connection.open,
      isHost: this.isHost,
      roomId: this.roomId,
      remotePlayerName: this.remotePlayerName,
      pingMs: this.currentPing,
      statusText: this.connection?.open ? 'Connected' : 'Disconnected',
    };
  }

  /**
   * Generates public shareable web invite link for friends.
   * Converts internal ais-dev preview URLs to public ais-pre URLs so friends can join with NO login!
   */
  public getInviteUrl(code: string): string {
    if (typeof window === 'undefined') return code;
    try {
      const url = new URL(window.location.href);
      // Convert development URL (ais-dev-) to public preview URL (ais-pre-)
      // ais-pre allows public preview access without requiring Google account login!
      if (url.hostname.includes('ais-dev-')) {
        url.hostname = url.hostname.replace('ais-dev-', 'ais-pre-');
      }
      url.search = '';
      url.hash = '';
      url.searchParams.set('room', code);
      return url.toString();
    } catch {
      let origin = window.location.origin;
      if (origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }
      return `${origin}/?room=${code}`;
    }
  }

  // Create a new room as Host (Team 1)
  public createRoom(hostPlayerName: string, onRoomCreated: (code: string) => void, onError: (err: string) => void) {
    this.cleanup();
    this.isHost = true;

    // Generate a clean, easy-to-read room code (e.g. "WRO-7821")
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomCode = `WRO-${randomChars}`;

    try {
      this.peer = new Peer(randomCode, {
        debug: 1,
        config: {
          iceServers: ICE_SERVERS,
        },
      });

      this.peer.on('open', (id) => {
        this.roomId = id;
        onRoomCreated(id);
        this.notifyState(`Room ready! Waiting for friend to join with code: ${id}`);
      });

      this.peer.on('connection', (conn) => {
        this.connection = conn;
        this.setupConnection(conn, hostPlayerName);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer host error:', err);
        if (err.type === 'unavailable-id') {
          // If collision, create peer with automatic unique ID
          const fallbackCode = `WRO-${Math.floor(1000 + Math.random() * 9000)}`;
          const fallbackPeer = new Peer(fallbackCode, {
            debug: 1,
            config: { iceServers: ICE_SERVERS },
          });
          fallbackPeer.on('open', (id) => {
            this.peer = fallbackPeer;
            this.roomId = id;
            onRoomCreated(id);
            this.notifyState(`Room ready! Waiting for friend to join with code: ${id}`);
          });
          fallbackPeer.on('connection', (c) => {
            this.connection = c;
            this.setupConnection(c, hostPlayerName);
          });
          fallbackPeer.on('error', (fErr) => {
            onError(fErr.message || 'Connection error');
          });
        } else {
          onError(err.message || 'Connection error');
        }
      });
    } catch (e: any) {
      onError(e?.message || 'Failed to initialize peer connection');
    }
  }

  // Join an existing room as Guest (Team 2)
  public joinRoom(targetRoomId: string, guestPlayerName: string, onConnected: () => void, onError: (err: string) => void) {
    this.cleanup();
    this.isHost = false;
    this.roomId = targetRoomId.trim();

    try {
      this.peer = new Peer({
        debug: 1,
        config: {
          iceServers: ICE_SERVERS,
        },
      });

      this.peer.on('open', () => {
        this.notifyState(`Connecting across internet to room ${this.roomId}...`);
        // Realtime UDP-style data channel for instant gaming sync without head-of-line blocking lag
        const conn = this.peer!.connect(this.roomId!, {
          reliable: false,
        });

        this.connection = conn;

        conn.on('open', () => {
          this.setupConnection(conn, guestPlayerName);
          // Handshake JOIN
          this.sendMessage({
            type: 'JOIN',
            payload: { name: guestPlayerName },
          });
          onConnected();
        });

        conn.on('error', (err) => {
          onError(err?.message || 'Connection to friend failed. Verify room code.');
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Peer join error:', err);
        onError(err?.message || 'Failed to connect to room. Check code and retry.');
      });
    } catch (e: any) {
      onError(e?.message || 'Failed to join room');
    }
  }

  private setupConnection(conn: DataConnection, localName: string) {
    conn.on('data', (data: any) => {
      const msg = data as OnlineMessage;
      if (!msg || !msg.type) return;

      if (msg.type === 'JOIN') {
        this.remotePlayerName = msg.payload?.name || 'Friend';
        this.sendMessage({
          type: 'JOIN_ACK',
          payload: { name: localName },
        });
        this.notifyState(`Friend (${this.remotePlayerName}) connected from afar!`);
      } else if (msg.type === 'JOIN_ACK') {
        this.remotePlayerName = msg.payload?.name || 'Host';
        this.notifyState(`Connected to match with ${this.remotePlayerName}!`);
      } else if (msg.type === 'PING') {
        this.sendMessage({ type: 'PONG', timestamp: msg.timestamp });
      } else if (msg.type === 'PONG') {
        if (msg.timestamp) {
          const ping = Math.round(Date.now() - msg.timestamp);
          this.currentPing = ping;
          this.updatePing(ping);
        }
      }

      // Broadcast to all registered message listeners
      for (const listener of this.messageListeners) {
        try {
          listener(msg);
        } catch (e) {
          console.error('Error in message listener:', e);
        }
      }
    });

    conn.on('close', () => {
      this.notifyState('Friend disconnected');
      this.cleanup();
    });

    // Start latency ping loop
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.connection?.open) {
        this.sendMessage({ type: 'PING', timestamp: Date.now() });
      }
    }, 2000);

    this.notifyState('Connected!');
  }

  private updatePing(ping: number) {
    this.notifyState(`Connected (${ping}ms ping · Cross-Country WebRTC)`);
  }

  private notifyState(statusText: string) {
    const state: OnlineState = {
      isConnected: !!this.connection && this.connection.open,
      isHost: this.isHost,
      roomId: this.roomId,
      remotePlayerName: this.remotePlayerName,
      pingMs: this.currentPing,
      statusText,
    };

    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    }
  }

  public sendMessage(msg: OnlineMessage) {
    if (this.connection && this.connection.open) {
      try {
        const dc = (this.connection as any).dataChannel as RTCDataChannel | undefined;
        if (dc && dc.bufferedAmount > 32768 && msg.type === 'SYNC_STATE') {
          // Drop stale state frame if network buffer is congested to prevent lag spikes
          return;
        }
        this.connection.send(msg);
      } catch (e) {
        console.warn('Failed to send WebRTC message:', e);
      }
    }
  }

  public cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = null;

    if (this.connection) {
      try {
        this.connection.close();
      } catch {}
      this.connection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    this.roomId = null;
    this.remotePlayerName = null;
    this.currentPing = null;
  }
}

export const onlineService = new OnlineManager();
