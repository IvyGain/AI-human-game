import { Server, Socket } from 'socket.io';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData,
  ChatMessage 
} from '@project-jin/shared';
import { gameManager } from '../game';
import { RoomManager } from '../room';
import { v4 as uuidv4 } from 'uuid';

export class SocketHandler {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private roomManager: RoomManager;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    roomManager: RoomManager
  ) {
    this.io = io;
    this.roomManager = roomManager;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('joinGame', (gameId: string, playerName: string) => {
        this.handleJoinGame(socket, gameId, playerName);
      });

      socket.on('leaveGame', () => {
        this.handleLeaveGame(socket);
      });

      socket.on('startGame', () => {
        this.handleStartGame(socket);
      });

      socket.on('nightAction', (action) => {
        this.handleNightAction(socket, action);
      });

      socket.on('vote', (targetId) => {
        this.handleVote(socket, targetId);
      });

      socket.on('sendMessage', (content) => {
        this.handleSendMessage(socket, content);
      });

      socket.on('addReaction', (data) => {
        this.handleAddReaction(socket, data);
      });

      socket.on('removeReaction', (data) => {
        this.handleRemoveReaction(socket, data);
      });

      socket.on('voiceStateChange', (isSpeaking) => {
        this.handleVoiceStateChange(socket, isSpeaking);
      });

      // === ROOM MANAGEMENT EVENTS ===
      socket.on('joinRoom', (roomCode: string, playerName: string, password?: string, isSpectator?: boolean) => {
        this.handleJoinRoom(socket, roomCode, playerName, password, isSpectator);
      });

      socket.on('leaveRoom', () => {
        this.handleLeaveRoom(socket);
      });

      socket.on('setReady', (isReady: boolean) => {
        this.handleSetReady(socket, isReady);
      });

      socket.on('addAIPlayer', () => {
        this.handleAddAIPlayer(socket);
      });

      socket.on('removeAIPlayer', (aiPlayerId: string) => {
        this.handleRemoveAIPlayer(socket, aiPlayerId);
      });

      socket.on('startRoomGame', () => {
        this.handleStartRoomGame(socket);
      });

      socket.on('sendRoomMessage', (content: string) => {
        this.handleSendRoomMessage(socket, content);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.handleLeaveGame(socket);
        this.handleLeaveRoom(socket);
      });
    });
  }

  private handleJoinGame(socket: Socket, gameId: string, playerName: string): void {
    try {
      const game = gameManager.getGame(gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      const player = game.addPlayer(playerName, false);
      socket.data.gameId = gameId;
      socket.data.playerId = player.id;
      socket.join(gameId);

      socket.emit('gameState', game.getGameState());
      socket.to(gameId).emit('playerJoined', player);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to join game');
    }
  }

  private handleLeaveGame(socket: Socket): void {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) return;

    const game = gameManager.getGame(gameId);
    if (game) {
      game.removePlayer(playerId);
      socket.to(gameId).emit('playerLeft', playerId);
      
      if (game.getGameState().players.length === 0) {
        gameManager.deleteGame(gameId);
      }
    }

    socket.leave(gameId);
    socket.data.gameId = undefined;
    socket.data.playerId = undefined;
  }

  private handleStartGame(socket: Socket): void {
    const { gameId } = socket.data;
    if (!gameId) {
      socket.emit('error', 'Not in a game');
      return;
    }

    const game = gameManager.getGame(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    try {
      game.startGame();
      this.setupGamePhaseHandlers(gameId, game);
      this.io.to(gameId).emit('gameState', game.getGameState());
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to start game');
    }
  }

  private setupGamePhaseHandlers(gameId: string, game: any): void {
    // 夜フェーズ: AIプレイヤーの行動を自動実行
    game.onPhaseChange('night', async () => {
      setTimeout(async () => {
        await game.executeAINightActions();
      }, 2000); // 2秒後にAI行動実行
    });

    // 朝フェーズ: 夜の結果を処理
    game.onPhaseChange('day_report', () => {
      const casualties = game.processNightActions();
      this.io.to(gameId).emit('nightResult', casualties);
      
      // システムメッセージで結果を通知
      if (casualties.length > 0) {
        const gameState = game.getGameState();
        const casualtyNames = casualties.map((id: string) => {
          const player = gameState.players.find((p: any) => p.id === id);
          return player?.name || '不明';
        });
        this.sendSystemMessage(gameId, `☠️ ${casualtyNames.join(', ')} が襲撃されました`);
      } else {
        this.sendSystemMessage(gameId, '☀️ 平和な朝を迎えました');
      }
      
      const winner = game.checkWinCondition();
      if (winner) {
        const finalState = game.getGameState();
        finalState.winner = winner;
        finalState.isFinished = true;
        this.io.to(gameId).emit('gameEnd', winner, finalState);
        gameManager.deleteGame(gameId);
        return;
      }
    });

    // 議論フェーズ: AIプレイヤーの議論を開始
    game.onPhaseChange('day_discussion', () => {
      game.startAIDiscussion((playerId: string, message: string) => {
        const chatMessage = {
          id: uuidv4(),
          playerId,
          content: message,
          timestamp: new Date(),
          phase: game.getGameState().phase,
          turn: game.getGameState().turn
        };
        this.io.to(gameId).emit('chatMessage', chatMessage);
      });
    });

    // 投票フェーズ: AIプレイヤーの投票を自動実行
    game.onPhaseChange('day_vote', async () => {
      game.stopAIDiscussion();
      
      setTimeout(async () => {
        await game.executeAIVoting();
      }, 2000); // 2秒後にAI投票実行
    });

    // 処刑フェーズ: 投票結果処理
    game.onPhaseChange('execution', () => {
      const voteResults = game.processVotes();
      this.io.to(gameId).emit('voteResult', voteResults);
      
      const winner = game.checkWinCondition();
      if (winner) {
        const finalState = game.getGameState();
        finalState.winner = winner;
        finalState.isFinished = true;
        this.io.to(gameId).emit('gameEnd', winner, finalState);
        gameManager.deleteGame(gameId);
        return;
      }
    });

    // 全フェーズでフェーズ変更を通知
    const phases = ['night', 'day_report', 'day_discussion', 'day_vote', 'execution'] as const;
    phases.forEach(phase => {
      game.onPhaseChange(phase, () => {
        this.io.to(gameId).emit('phaseChange', phase);
      });
    });
  }

  private handleNightAction(socket: Socket, action: any): void {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) {
      socket.emit('error', 'Not in a game');
      return;
    }

    const game = gameManager.getGame(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    try {
      game.executeNightAction({
        ...action,
        playerId,
        turn: game.getGameState().turn
      });
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to execute action');
    }
  }

  private handleVote(socket: Socket, targetId: string): void {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) {
      socket.emit('error', 'Not in a game');
      return;
    }

    const game = gameManager.getGame(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    try {
      game.castVote(playerId, targetId);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to vote');
    }
  }

  private async handleSendMessage(socket: Socket, content: string): Promise<void> {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) {
      socket.emit('error', 'Not in a game');
      return;
    }

    const game = gameManager.getGame(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    const player = game.getPlayer(playerId);
    if (!player || player.status !== 'alive') {
      socket.emit('error', 'Cannot send message');
      return;
    }

    // GameEngineのaddChatMessageを使用してAIに学習させる
    const message = await game.addChatMessage(playerId, content);
    this.io.to(gameId).emit('chatMessage', message);
  }

  private handleAddReaction(socket: Socket, data: { messageId: string; emoji: string }): void {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) {
      socket.emit('error', 'Not in a game');
      return;
    }

    // リアクション管理（簡易実装）
    // TODO: GameEngineにリアクション管理機能を追加
    this.io.to(gameId).emit('messageReaction', {
      messageId: data.messageId,
      emoji: data.emoji,
      playerIds: [playerId] // 実際にはプレイヤーIDを追加/削除する処理が必要
    });
  }

  private handleRemoveReaction(socket: Socket, data: { messageId: string; emoji: string }): void {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) {
      socket.emit('error', 'Not in a game');
      return;
    }

    // リアクション削除（簡易実装）
    // TODO: GameEngineにリアクション管理機能を追加
    this.io.to(gameId).emit('messageReaction', {
      messageId: data.messageId,
      emoji: data.emoji,
      playerIds: [] // 実際にはプレイヤーIDを削除する処理が必要
    });
  }

  private handleVoiceStateChange(socket: Socket, isSpeaking: boolean): void {
    const { gameId, playerId } = socket.data;
    if (!gameId || !playerId) return;

    const game = gameManager.getGame(gameId);
    if (!game) return;

    const player = game.getPlayer(playerId);
    if (!player || player.status !== 'alive') return;

    // 音声状態を他のプレイヤーに通知
    socket.to(gameId).emit('playerVoiceState', playerId, isSpeaking);
  }

  private sendSystemMessage(gameId: string, content: string): void {
    const systemMessage: ChatMessage = {
      id: uuidv4(),
      playerId: 'system',
      content,
      timestamp: new Date(),
      phase: 'day_report',
      turn: 0
    };
    this.io.to(gameId).emit('chatMessage', systemMessage);
  }

  // === ROOM MANAGEMENT HANDLERS ===

  private handleJoinRoom(socket: Socket, roomCode: string, playerName: string, password?: string, isSpectator?: boolean): void {
    try {
      console.log(`ルーム参加リクエスト - コード: ${roomCode}, プレイヤー名: ${playerName}, 観戦者: ${isSpectator}`);
      const room = this.roomManager.joinRoomByCode(roomCode, playerName, socket.id, password, isSpectator);
      
      socket.data.roomId = room.id;
      
      // プレイヤーIDを正しく設定（プレイヤーリストと観戦者リストの両方をチェック）
      const participant = room.players.find(p => p.socketId === socket.id) || 
                         room.spectators.find(p => p.socketId === socket.id);
      socket.data.playerId = participant?.id;
      socket.data.isSpectator = isSpectator || false;
      
      console.log(`ルーム参加成功 - roomId: ${socket.data.roomId}, playerId: ${socket.data.playerId}, isSpectator: ${socket.data.isSpectator}`);
      
      socket.join(room.id);

      // 参加者に最新のルーム状態を送信
      this.io.to(room.id).emit('roomUpdate', {
        room: {
          id: room.id,
          code: room.code,
          settings: room.settings,
          players: room.players,
          spectators: room.spectators,
          status: room.status,
          createdAt: room.createdAt
        }
      });

      // 参加通知
      const joinMessage = isSpectator ? `${playerName}が観戦者として参加しました` : `${playerName}が参加しました`;
      socket.to(room.id).emit('roomMessage', {
        type: 'system',
        content: joinMessage,
        timestamp: new Date()
      });

      console.log(`${isSpectator ? 'Spectator' : 'Player'} ${playerName} joined room ${roomCode} via WebSocket`);
    } catch (error) {
      console.error(`ルーム参加エラー:`, error);
      socket.emit('error', error instanceof Error ? error.message : 'Failed to join room');
    }
  }

  private handleLeaveRoom(socket: Socket): void {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = this.roomManager.leaveRoomBySocketId(socket.id);
    
    if (room) {
      // 残りの参加者に更新を通知
      this.io.to(room.id).emit('roomUpdate', {
        room: {
          id: room.id,
          code: room.code,
          settings: room.settings,
          players: room.players,
          spectators: room.spectators,
          status: room.status,
          createdAt: room.createdAt
        }
      });
    }

    socket.leave(roomId);
    socket.data.roomId = undefined;
    socket.data.playerId = undefined;
  }

  private handleSetReady(socket: Socket, isReady: boolean): void {
    const { roomId, playerId, isSpectator } = socket.data;
    if (!roomId || !playerId) {
      socket.emit('error', 'Not in a room');
      return;
    }

    // 観戦者は準備状態を変更できない
    if (isSpectator) {
      socket.emit('error', 'Spectators cannot change ready state');
      return;
    }

    const room = this.roomManager.setPlayerReady(playerId, isReady);
    if (room) {
      this.io.to(room.id).emit('roomUpdate', {
        room: {
          id: room.id,
          code: room.code,
          settings: room.settings,
          players: room.players,
          spectators: room.spectators,
          status: room.status,
          createdAt: room.createdAt
        }
      });
    }
  }

  private handleAddAIPlayer(socket: Socket): void {
    const { roomId, playerId, isSpectator } = socket.data;
    console.log(`AI追加リクエスト - roomId: ${roomId}, playerId: ${playerId}, isSpectator: ${isSpectator}`);
    
    if (!roomId || !playerId) {
      console.log('AI追加失敗: ルームまたはプレイヤーIDがありません');
      socket.emit('error', 'Not in a room');
      return;
    }

    // 観戦者はAIを追加できない
    if (isSpectator) {
      console.log('AI追加失敗: 観戦者はAIを追加できません');
      socket.emit('error', 'Spectators cannot add AI players');
      return;
    }

    try {
      console.log(`AIプレイヤー追加試行中...`);
      const room = this.roomManager.addAIPlayer(roomId, playerId);
      if (room) {
        this.io.to(room.id).emit('roomUpdate', {
          room: {
            id: room.id,
            code: room.code,
            settings: room.settings,
            players: room.players,
            spectators: room.spectators,
            status: room.status,
            createdAt: room.createdAt
          }
        });

        // 追加通知
        const addedAI = room.players[room.players.length - 1];
        socket.to(room.id).emit('roomMessage', {
          type: 'system',
          content: `AIプレイヤー ${addedAI.name} が追加されました`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to add AI player');
    }
  }

  private handleRemoveAIPlayer(socket: Socket, aiPlayerId: string): void {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      socket.emit('error', 'Not in a room');
      return;
    }

    try {
      const room = this.roomManager.removeAIPlayer(roomId, playerId, aiPlayerId);
      if (room) {
        this.io.to(room.id).emit('roomUpdate', {
          room: {
            id: room.id,
            code: room.code,
            settings: room.settings,
            players: room.players,
            spectators: room.spectators,
            status: room.status,
            createdAt: room.createdAt
          }
        });
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to remove AI player');
    }
  }

  private handleStartRoomGame(socket: Socket): void {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      socket.emit('error', 'Not in a room');
      return;
    }

    try {
      if (!this.roomManager.canStartGame(roomId)) {
        socket.emit('error', 'ゲーム開始条件が満たされていません');
        return;
      }

      const room = this.roomManager.startGame(roomId);
      if (room) {
        // ゲーム作成
        const gameId = gameManager.createGame();
        const game = gameManager.getGame(gameId);
        
        if (game) {
          // プレイヤーをゲームに追加
          room.players.forEach(player => {
            game.addPlayer(player.name, player.isAI);
          });

          // ゲーム開始
          game.startGame();
          this.setupGamePhaseHandlers(gameId, game);

          // 全プレイヤーをゲームルームに移動
          this.io.to(roomId).emit('gameStarted', {
            gameId,
            gameState: game.getGameState()
          });

          // WebSocketルームをゲームルームに変更
          const sockets = this.io.sockets.adapter.rooms.get(roomId);
          if (sockets) {
            for (const socketId of sockets) {
              const playerSocket = this.io.sockets.sockets.get(socketId);
              if (playerSocket) {
                playerSocket.leave(roomId);
                playerSocket.join(gameId);
                playerSocket.data.gameId = gameId;
                playerSocket.data.roomId = undefined;
              }
            }
          }

          console.log(`Game started for room ${room.code} -> game ${gameId}`);
        }
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to start game');
    }
  }

  private handleSendRoomMessage(socket: Socket, content: string): void {
    const { roomId, playerId } = socket.data;
    if (!roomId || !playerId) {
      socket.emit('error', 'Not in a room');
      return;
    }

    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    // プレイヤーまたは観戦者を探す
    const participant = room.players.find(p => p.id === playerId) || 
                       room.spectators.find(p => p.id === playerId);
    if (!participant) {
      socket.emit('error', 'Participant not found in room');
      return;
    }

    // チャットメッセージを送信
    this.io.to(roomId).emit('roomMessage', {
      type: 'chat',
      playerName: participant.name,
      content,
      timestamp: new Date()
    });
  }
}