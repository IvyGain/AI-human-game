import { v4 as uuidv4 } from 'uuid';

export interface RoomSettings {
  roomName: string;
  maxPlayers: number;
  password: string;
  isPrivate: boolean;
  nightDuration: number;
  dayDuration: number;
  voteDuration: number;
  roles: {
    ai: number;
    engineer: number;
    cyberGuard: number;
    citizen: number;
    trickster: number;
  };
}

export interface RoomPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  isAI: boolean;
  isSpectator: boolean;
  socketId: string;
}

export interface Room {
  id: string;
  code: string;
  settings: RoomSettings;
  players: RoomPlayer[];
  spectators: RoomPlayer[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
  hostId: string;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private roomCodes: Set<string> = new Set();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  /**
   * ユニークなルームコード生成
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.roomCodes.has(code));
    
    this.roomCodes.add(code);
    return code;
  }

  /**
   * ルーム作成
   */
  createRoom(settings: RoomSettings, hostName: string, hostSocketId: string): Room {
    const roomId = uuidv4();
    const roomCode = this.generateRoomCode();
    const hostId = uuidv4();

    const hostPlayer: RoomPlayer = {
      id: hostId,
      name: hostName,
      isReady: false,
      isHost: true,
      isAI: false,
      isSpectator: false,
      socketId: hostSocketId
    };

    const room: Room = {
      id: roomId,
      code: roomCode,
      settings,
      players: [hostPlayer],
      spectators: [],
      status: 'waiting',
      createdAt: new Date(),
      hostId
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);

    console.log(`Room created: ${roomCode} (${roomId})`);
    return room;
  }

  /**
   * ルーム参加（コード指定）
   */
  joinRoomByCode(code: string, playerName: string, socketId: string, password?: string, isSpectator: boolean = false): Room | null {
    const room = Array.from(this.rooms.values()).find(r => r.code === code);
    
    if (!room) {
      throw new Error('ルームが見つかりません');
    }

    // 観戦者の場合はゲーム中でも参加可能
    if (!isSpectator && room.status !== 'waiting') {
      throw new Error('このルームは既にゲーム中です');
    }

    // 観戦者でない場合のみ人数制限チェック
    if (!isSpectator && room.players.length >= room.settings.maxPlayers) {
      throw new Error('ルームが満室です');
    }

    if (room.settings.isPrivate && room.settings.password !== password) {
      throw new Error('パスワードが間違っています');
    }

    // 同名チェック（プレイヤーと観戦者の両方）
    const allParticipants = [...room.players, ...room.spectators];
    if (allParticipants.some(p => p.name === playerName)) {
      throw new Error('同じ名前のプレイヤーが既に参加しています');
    }

    const playerId = uuidv4();
    const newParticipant: RoomPlayer = {
      id: playerId,
      name: playerName,
      isReady: isSpectator ? true : false, // 観戦者は常に準備完了
      isHost: false,
      isAI: false,
      isSpectator,
      socketId
    };

    if (isSpectator) {
      room.spectators.push(newParticipant);
      console.log(`Spectator ${playerName} joined room ${code}`);
    } else {
      room.players.push(newParticipant);
      console.log(`Player ${playerName} joined room ${code}`);
    }
    
    this.playerRooms.set(playerId, room.id);
    return room;
  }

  /**
   * ルーム参加（ID指定）
   */
  joinRoomById(roomId: string, playerName: string, socketId: string, password?: string, isSpectator: boolean = false): Room | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new Error('ルームが見つかりません');
    }

    return this.joinRoomByCode(room.code, playerName, socketId, password, isSpectator);
  }

  /**
   * プレイヤーの準備状態を更新
   */
  setPlayerReady(playerId: string, isReady: boolean): Room | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = isReady;
    }

    return room;
  }

  /**
   * AIプレイヤー追加
   */
  addAIPlayer(roomId: string, hostId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // ホストかどうかチェック
    if (room.hostId !== hostId) {
      throw new Error('ホストのみがAIプレイヤーを追加できます');
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('ルームが満室です');
    }

    const aiNames = ['ALI-CE', 'BOB-2', 'CHAR-7', 'DATA-9', 'EVE-X', 'FELIX', 'GAMMA', 'HALO-1', 'IRIS-5', 'JINX-9'];
    const usedNames = room.players.map(p => p.name);
    const availableNames = aiNames.filter(name => !usedNames.includes(name));

    if (availableNames.length === 0) {
      throw new Error('使用可能なAI名がありません');
    }

    const aiPlayer: RoomPlayer = {
      id: uuidv4(),
      name: availableNames[0],
      isReady: true,
      isHost: false,
      isAI: true,
      isSpectator: false,
      socketId: ''
    };

    room.players.push(aiPlayer);
    console.log(`AI player ${aiPlayer.name} added to room ${room.code}`);
    
    return room;
  }

  /**
   * AIプレイヤー削除
   */
  removeAIPlayer(roomId: string, hostId: string, aiPlayerId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // ホストかどうかチェック
    if (room.hostId !== hostId) {
      throw new Error('ホストのみがAIプレイヤーを削除できます');
    }

    const aiPlayerIndex = room.players.findIndex(p => p.id === aiPlayerId && p.isAI);
    if (aiPlayerIndex === -1) {
      throw new Error('AIプレイヤーが見つかりません');
    }

    const removedPlayer = room.players.splice(aiPlayerIndex, 1)[0];
    console.log(`AI player ${removedPlayer.name} removed from room ${room.code}`);
    
    return room;
  }

  /**
   * プレイヤー退出
   */
  leaveRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    // プレイヤーリストから探す
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      const leavingPlayer = room.players[playerIndex];
      room.players.splice(playerIndex, 1);
      this.playerRooms.delete(playerId);

      // ホストが退出した場合の処理
      if (leavingPlayer.isHost && room.players.length > 0) {
        // 最初の人間プレイヤーを新しいホストにする
        const newHost = room.players.find(p => !p.isAI);
        if (newHost) {
          newHost.isHost = true;
          room.hostId = newHost.id;
          console.log(`${newHost.name} is now the host of room ${room.code}`);
        }
      }

      console.log(`Player ${leavingPlayer.name} left room ${room.code}`);
    } else {
      // 観戦者リストから探す
      const spectatorIndex = room.spectators.findIndex(p => p.id === playerId);
      if (spectatorIndex !== -1) {
        const leavingSpectator = room.spectators[spectatorIndex];
        room.spectators.splice(spectatorIndex, 1);
        this.playerRooms.delete(playerId);
        console.log(`Spectator ${leavingSpectator.name} left room ${room.code}`);
      } else {
        return null;
      }
    }

    // ルームが完全に空になった場合は削除（プレイヤーも観戦者もいない）
    if (room.players.length === 0 && room.spectators.length === 0) {
      this.rooms.delete(roomId);
      this.roomCodes.delete(room.code);
      console.log(`Room ${room.code} deleted (empty)`);
      return null;
    }

    return room;
  }

  /**
   * SocketIDでプレイヤー退出
   */
  leaveRoomBySocketId(socketId: string): Room | null {
    for (const [playerId, roomId] of this.playerRooms.entries()) {
      const room = this.rooms.get(roomId);
      if (room) {
        // プレイヤーリストから探す
        const player = room.players.find(p => p.socketId === socketId);
        if (player) {
          return this.leaveRoom(player.id);
        }
        
        // 観戦者リストからも探す
        const spectator = room.spectators.find(p => p.socketId === socketId);
        if (spectator) {
          return this.leaveRoom(spectator.id);
        }
      }
    }
    return null;
  }

  /**
   * ルーム取得（ID指定）
   */
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  /**
   * ルーム取得（コード指定）
   */
  getRoomByCode(code: string): Room | null {
    return Array.from(this.rooms.values()).find(r => r.code === code) || null;
  }

  /**
   * プレイヤーのルーム取得
   */
  getPlayerRoom(playerId: string): Room | null {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  /**
   * SocketIDからプレイヤーのルーム取得
   */
  getPlayerRoomBySocketId(socketId: string): Room | null {
    for (const room of this.rooms.values()) {
      // プレイヤーリストから探す
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        return room;
      }
      
      // 観戦者リストからも探す
      const spectator = room.spectators.find(p => p.socketId === socketId);
      if (spectator) {
        return room;
      }
    }
    return null;
  }

  /**
   * 公開ルーム一覧取得
   */
  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values())
      .filter(room => !room.settings.isPrivate && room.status === 'waiting')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * ゲーム開始可能かチェック
   */
  canStartGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const readyCount = room.players.filter(p => p.isReady).length;
    return room.players.length >= 5 && 
           readyCount === room.players.length && 
           room.players.length === room.settings.maxPlayers;
  }

  /**
   * ゲーム開始
   */
  startGame(roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (!this.canStartGame(roomId)) {
      throw new Error('ゲーム開始条件が満たされていません');
    }

    room.status = 'playing';
    console.log(`Game started in room ${room.code}`);
    
    return room;
  }

  /**
   * ルーム設定更新（ホストのみ）
   */
  updateRoomSettings(roomId: string, hostId: string, newSettings: Partial<RoomSettings>): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.hostId !== hostId) {
      throw new Error('ホストのみがルーム設定を変更できます');
    }

    if (room.status !== 'waiting') {
      throw new Error('ゲーム中は設定を変更できません');
    }

    room.settings = { ...room.settings, ...newSettings };
    console.log(`Room settings updated for ${room.code}`);
    
    return room;
  }

  /**
   * アクティブなルーム数取得
   */
  getActiveRoomsCount(): number {
    return this.rooms.size;
  }

  /**
   * 統計情報取得
   */
  getStats() {
    const totalRooms = this.rooms.size;
    const waitingRooms = Array.from(this.rooms.values()).filter(r => r.status === 'waiting').length;
    const playingRooms = Array.from(this.rooms.values()).filter(r => r.status === 'playing').length;
    const totalPlayers = Array.from(this.rooms.values()).reduce((sum, room) => sum + room.players.length, 0);
    const totalSpectators = Array.from(this.rooms.values()).reduce((sum, room) => sum + room.spectators.length, 0);

    return {
      totalRooms,
      waitingRooms,
      playingRooms,
      totalPlayers,
      totalSpectators
    };
  }
}