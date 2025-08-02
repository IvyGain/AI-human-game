import { io, Socket } from 'socket.io-client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '@project-jin/shared';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!this.socket) {
      this.socket = io('/', {
        transports: ['websocket', 'polling'], // iOS Safari対応でpollingも追加
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: false,
        autoConnect: true,
        upgrade: true,
      });

      // 接続イベントの処理
      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      });

      // 切断イベントの処理
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        
        // iOS Safari特有の切断処理
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // サーバー側またはクライアント側からの切断
          return;
        }
        
        // 自動再接続の実装（ネットワーク不安定な環境用）
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });

      // エラーイベントの処理
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnection attempts reached');
          this.handleConnectionFailure();
        }
      });

      // iOS Safari用のvisibilitychange対応
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.socket && !this.socket.connected) {
            console.log('Page became visible, attempting to reconnect...');
            this.reconnect();
          }
        });
      }

      // iOS Safari用のonline/offline対応
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          console.log('Network came online, attempting to reconnect...');
          this.reconnect();
        });
      }
    }
    return this.socket;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts + 1} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  private reconnect(): void {
    if (this.socket && !this.socket.connected) {
      console.log('Attempting manual reconnection...');
      this.socket.connect();
    }
  }

  private handleConnectionFailure(): void {
    console.error('Connection failed permanently');
    // ユーザーに通知するためのイベントを発行
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('websocket-connection-failed'));
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.reconnectAttempts = 0;
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // iOS Safari用の強制再接続メソッド
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.connect();
  }
}

export const socketService = new SocketService();