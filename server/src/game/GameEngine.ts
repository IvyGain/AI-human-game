import { 
  GameState, 
  Player, 
  GamePhase, 
  NightAction, 
  VotingResult,
  Faction,
  RoleName,
  ChatMessage
} from '@project-jin/shared';
import { ROLES, GAME_CONFIG } from '@project-jin/shared';
import { v4 as uuidv4 } from 'uuid';
import { AIPlayerManager } from '../ai/AIPlayerManager.js';
import { DatabaseService } from '../database/DatabaseService.js';
import { GlickoRating } from '../rating/GlickoRating.js';

export class GameEngine {
  private gameState: GameState;
  private phaseTimer: NodeJS.Timeout | null = null;
  private phaseCallbacks: Map<GamePhase, () => void> = new Map();
  private aiPlayerManager: AIPlayerManager = new AIPlayerManager();
  private chatHistory: ChatMessage[] = [];
  private dbService: DatabaseService;
  private ratingSystem: GlickoRating = new GlickoRating();

  constructor(gameId: string, dbService?: DatabaseService) {
    this.gameState = {
      id: gameId,
      phase: 'night',
      turn: 1,
      players: [],
      nightActions: [],
      votingResults: [],
      isFinished: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dbService = dbService || new DatabaseService();
  }

  addPlayer(name: string, isBot: boolean = false): Player {
    const player: Player = {
      id: uuidv4(),
      name,
      status: 'alive',
      isBot
    };
    this.gameState.players.push(player);
    this.gameState.updatedAt = new Date();
    return player;
  }

  removePlayer(playerId: string): void {
    this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
    this.gameState.updatedAt = new Date();
  }

  canStartGame(): boolean {
    const playerCount = this.gameState.players.length;
    return playerCount >= GAME_CONFIG.minPlayers && playerCount <= GAME_CONFIG.maxPlayers;
  }

  startGame(): void {
    if (!this.canStartGame()) {
      throw new Error('Invalid player count');
    }

    this.assignRoles();
    this.initializeAIPlayers();
    this.gameState.phase = 'night';
    this.gameState.turn = 1;
    this.startPhaseTimer();
  }

  private assignRoles(): void {
    const playerCount = this.gameState.players.length;
    const distribution = GAME_CONFIG.roleDistribution[playerCount as keyof typeof GAME_CONFIG.roleDistribution];
    
    if (!distribution) {
      throw new Error(`No role distribution for ${playerCount} players`);
    }

    const rolePool: RoleName[] = [];
    for (const [roleName, count] of Object.entries(distribution)) {
      for (let i = 0; i < count; i++) {
        rolePool.push(roleName as RoleName);
      }
    }

    const shuffledRoles = this.shuffle(rolePool);
    this.gameState.players.forEach((player, index) => {
      player.role = ROLES[shuffledRoles[index]];
    });
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  executeNightAction(action: NightAction): void {
    if (this.gameState.phase !== 'night') {
      throw new Error('Night actions can only be performed during night phase');
    }

    const player = this.getPlayer(action.playerId);
    if (!player || player.status !== 'alive') {
      throw new Error('Invalid player or player is dead');
    }

    this.gameState.nightActions.push({
      ...action,
      turn: this.gameState.turn
    });
  }

  processNightActions(): string[] {
    const casualties: string[] = [];
    const protectedPlayers = new Set<string>();

    const protectActions = this.gameState.nightActions.filter(
      action => action.actionType === 'protect' && action.turn === this.gameState.turn
    );
    protectActions.forEach(action => {
      protectedPlayers.add(action.targetId);
    });

    const attackActions = this.gameState.nightActions.filter(
      action => action.actionType === 'attack' && action.turn === this.gameState.turn
    );
    
    attackActions.forEach(action => {
      if (!protectedPlayers.has(action.targetId)) {
        const target = this.getPlayer(action.targetId);
        if (target && target.status === 'alive') {
          target.status = 'dead';
          casualties.push(action.targetId);
        }
      }
    });

    return casualties;
  }

  castVote(voterId: string, targetId: string): void {
    if (this.gameState.phase !== 'day_vote') {
      throw new Error('Voting can only be done during vote phase');
    }

    const voter = this.getPlayer(voterId);
    if (!voter || voter.status !== 'alive') {
      throw new Error('Invalid voter or voter is dead');
    }

    const existingVote = this.gameState.votingResults.find(
      v => v.voterId === voterId && v.turn === this.gameState.turn
    );

    if (existingVote) {
      existingVote.targetId = targetId;
    } else {
      this.gameState.votingResults.push({
        voterId,
        targetId,
        turn: this.gameState.turn
      });
    }
  }

  processVotes(): { playerId: string; votes: number }[] {
    const currentVotes = this.gameState.votingResults.filter(
      v => v.turn === this.gameState.turn
    );

    const voteCount = new Map<string, number>();
    currentVotes.forEach(vote => {
      voteCount.set(vote.targetId, (voteCount.get(vote.targetId) || 0) + 1);
    });

    const results = Array.from(voteCount.entries())
      .map(([playerId, votes]) => ({ playerId, votes }))
      .sort((a, b) => b.votes - a.votes);

    if (results.length > 0 && results[0].votes > 0) {
      const maxVotes = results[0].votes;
      const topVoted = results.filter(r => r.votes === maxVotes);
      
      if (topVoted.length === 1) {
        const eliminatedPlayer = this.getPlayer(topVoted[0].playerId);
        if (eliminatedPlayer) {
          eliminatedPlayer.status = 'dead';
        }
      }
    }

    return results;
  }

  checkWinCondition(): Faction | null {
    const alivePlayers = this.gameState.players.filter(p => p.status === 'alive');
    const humanCount = alivePlayers.filter(p => p.role?.faction === 'human').length;
    const aiCount = alivePlayers.filter(p => p.role?.faction === 'ai').length;
    const thirdCount = alivePlayers.filter(p => p.role?.faction === 'third').length;

    if (aiCount === 0 && thirdCount === 0) {
      return 'human';
    }

    if (humanCount <= aiCount) {
      return 'ai';
    }

    const trickster = alivePlayers.find(p => p.role?.name === 'trickster');
    if (trickster && alivePlayers.length === 1) {
      return 'third';
    }

    return null;
  }

  advancePhase(): void {
    const phaseOrder: GamePhase[] = ['night', 'day_report', 'day_discussion', 'day_vote', 'execution'];
    const currentIndex = phaseOrder.indexOf(this.gameState.phase);
    const nextIndex = (currentIndex + 1) % phaseOrder.length;
    
    this.gameState.phase = phaseOrder[nextIndex];
    
    if (this.gameState.phase === 'night') {
      this.gameState.turn++;
    }

    this.startPhaseTimer();
    
    const callback = this.phaseCallbacks.get(this.gameState.phase);
    if (callback) {
      callback();
    }
  }

  private startPhaseTimer(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
    }

    const phaseDurations: Partial<Record<GamePhase, number>> = {
      night: GAME_CONFIG.phases.night.duration * 1000,
      day_report: GAME_CONFIG.phases.day_report.duration * 1000,
      day_discussion: GAME_CONFIG.phases.day_discussion.duration * 1000,
      day_vote: GAME_CONFIG.phases.day_vote.duration * 1000
    };

    const duration = phaseDurations[this.gameState.phase];
    if (duration) {
      this.phaseTimer = setTimeout(() => {
        this.advancePhase();
      }, duration);
    }
  }

  onPhaseChange(phase: GamePhase, callback: () => void): void {
    this.phaseCallbacks.set(phase, callback);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.gameState.players.find(p => p.id === playerId);
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getAlivePlayers(): Player[] {
    return this.gameState.players.filter(p => p.status === 'alive');
  }

  investigatePlayer(investigatorId: string, targetId: string): 'AI' | 'Not AI' | null {
    const investigator = this.getPlayer(investigatorId);
    const target = this.getPlayer(targetId);

    if (!investigator || !target || investigator.role?.name !== 'engineer') {
      return null;
    }

    return target.role?.name === 'ai' ? 'AI' : 'Not AI';
  }

  /**
   * AIプレイヤー関連のメソッド
   */
  addBotPlayers(count: number): Player[] {
    const botPlayers: Player[] = [];
    const botNames = [
      'アリス', 'ボブ', 'チャーリー', 'ダイアナ', 'イヴ', 
      'フランク', 'グレース', 'ヘンリー', 'アイビー', 'ジャック'
    ];

    for (let i = 0; i < count && i < botNames.length; i++) {
      const botPlayer = this.addPlayer(`AI-${botNames[i]}`, true);
      botPlayers.push(botPlayer);
    }

    return botPlayers;
  }

  initializeAIPlayers(): void {
    const botPlayers = this.gameState.players.filter(p => p.isBot);
    for (const player of botPlayers) {
      this.aiPlayerManager.initializeAIPlayer(player);
    }
  }

  async executeAINightActions(): Promise<void> {
    const aiActions = await this.aiPlayerManager.executeNightActions(this.gameState);
    
    for (const action of aiActions) {
      this.executeNightAction({
        playerId: action.playerId,
        targetId: action.targetId,
        actionType: action.actionType as 'investigate' | 'protect' | 'attack',
        turn: this.gameState.turn
      });
    }
  }

  async executeAIVoting(): Promise<void> {
    const aiVotes = await this.aiPlayerManager.executeVoting(this.gameState);
    
    for (const vote of aiVotes) {
      this.castVote(vote.playerId, vote.targetId);
    }
  }

  async addChatMessage(playerId: string, content: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: uuidv4(),
      playerId,
      content,
      timestamp: new Date(),
      phase: this.gameState.phase,
      turn: this.gameState.turn
    };

    this.chatHistory.push(message);
    
    // AIプレイヤーに学習させる
    this.aiPlayerManager.processChatMessage(message, this.gameState);

    // データベースに保存
    if (this.dbService) {
      try {
        const player = this.getPlayer(playerId);
        await this.dbService.saveChatMessage(
          this.gameState.id,
          content,
          this.gameState.phase.toUpperCase() as any,
          this.gameState.turn,
          player?.isBot ? undefined : playerId,
          player?.name,
          playerId === 'system'
        );
      } catch (error) {
        console.error('Failed to save chat message:', error);
      }
    }

    return message;
  }

  startAIDiscussion(onAIMessage: (playerId: string, message: string) => void): void {
    if (this.gameState.phase === 'day_discussion') {
      this.aiPlayerManager.startDiscussionPhase(this.gameState, (playerId, message) => {
        const aiMessage = this.addChatMessage(playerId, message);
        onAIMessage(playerId, message);
      });
    }
  }

  stopAIDiscussion(): void {
    this.aiPlayerManager.stopDiscussionPhase();
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  getRecentChatMessages(limit: number = 10): ChatMessage[] {
    return this.chatHistory.slice(-limit);
  }

  async finishGame(winner: Faction): Promise<void> {
    this.gameState.winner = winner;
    this.gameState.isFinished = true;
    this.gameState.updatedAt = new Date();

    // データベースにゲーム結果を保存
    if (this.dbService) {
      try {
        await this.dbService.finishGame(this.gameState.id, winner);
        
        // レーティング更新
        await this.updatePlayerRatings(winner);
        
        // リプレイデータ保存
        await this.saveGameReplay();
        
        // 統計情報更新
        await this.updateGameStats(winner);
      } catch (error) {
        console.error('Failed to save game data:', error);
      }
    }
  }

  private async updatePlayerRatings(winner: Faction): Promise<void> {
    const humanPlayers = this.gameState.players.filter(p => !p.isBot);
    if (humanPlayers.length < 2) return;

    // プレイヤーの現在のレーティング情報を取得
    const playerRatings = await Promise.all(
      humanPlayers.map(async (player) => {
        const user = await this.dbService.getUserByName(player.name);
        return {
          player,
          user,
          rating: user?.rating || 1000,
          deviation: user?.ratingDeviation || 350,
          volatility: user?.volatility || 0.06
        };
      })
    );

    // 順位を計算（勝利陣営が上位）
    const gameResults = playerRatings.map(({ player }) => {
      if (player.role?.faction === winner) {
        return 0; // 勝利者は1位
      } else {
        return 1; // 敗北者は2位
      }
    });

    // Glicko-2レーティング更新
    const glickoPlayers = playerRatings.map(p => ({
      rating: p.rating,
      deviation: p.deviation,
      volatility: p.volatility
    }));

    const updatedRatings = this.ratingSystem.updateMultiplayerRatings(glickoPlayers, gameResults);

    // データベースに更新結果を保存
    await Promise.all(
      playerRatings.map(async (playerRating, index) => {
        if (playerRating.user) {
          const newRating = updatedRatings[index];
          await this.dbService.updateUserRating(
            playerRating.user.id,
            newRating.rating,
            newRating.deviation,
            newRating.volatility
          );

          // ゲーム統計更新
          const won = playerRating.player.role?.faction === winner;
          await this.dbService.updateUserGameStats(playerRating.user.id, won);
          
          if (playerRating.player.role) {
            await this.dbService.updatePlayerStats(
              playerRating.user.id,
              playerRating.player.role.name,
              won
            );
          }
        }
      })
    );
  }

  private async saveGameReplay(): Promise<void> {
    const replayData = {
      gameState: this.gameState,
      chatHistory: this.chatHistory,
      playerActions: this.gameState.nightActions,
      votes: this.gameState.votingResults,
      metadata: {
        duration: this.gameState.updatedAt.getTime() - this.gameState.createdAt.getTime(),
        aiPlayerCount: this.gameState.players.filter(p => p.isBot).length,
        humanPlayerCount: this.gameState.players.filter(p => !p.isBot).length
      }
    };

    await this.dbService.saveGameReplay(this.gameState.id, replayData);
  }

  private async updateGameStats(winner: Faction): Promise<void> {
    // デイリー統計更新
    await this.dbService.updateDailyStats(new Date());
  }

  async saveNightAction(action: NightAction): Promise<void> {
    if (this.dbService) {
      try {
        await this.dbService.saveNightAction(
          this.gameState.id,
          action.playerId,
          action.targetId,
          action.actionType.toUpperCase() as any,
          action.turn
        );
      } catch (error) {
        console.error('Failed to save night action:', error);
      }
    }
  }

  async saveVote(voterId: string, targetId: string): Promise<void> {
    if (this.dbService) {
      try {
        await this.dbService.saveVote(
          this.gameState.id,
          voterId,
          targetId,
          this.gameState.turn
        );
      } catch (error) {
        console.error('Failed to save vote:', error);
      }
    }
  }

  async initializeGameInDatabase(): Promise<void> {
    if (this.dbService) {
      try {
        await this.dbService.createGame(this.gameState.players.length);
        
        // プレイヤー参加情報を保存
        await Promise.all(
          this.gameState.players.map(async (player) => {
            const user = player.isBot ? undefined : await this.dbService.getUserByName(player.name);
            await this.dbService.addPlayerToGame(
              this.gameState.id,
              player.name,
              user?.id,
              player.isBot
            );
          })
        );
      } catch (error) {
        console.error('Failed to initialize game in database:', error);
      }
    }
  }

  destroy(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
    }
    this.aiPlayerManager.clear();
  }
}