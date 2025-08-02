import { AIPlayerEngine } from './AIPlayerEngine.js';
import { getPersonalityForRole, getRandomPersonality } from './AIPersonalities.js';
import { Player, GameState, ChatMessage } from '@project-jin/shared';

interface AIPlayerInstance {
  playerId: string;
  engine: AIPlayerEngine;
  lastActionTime: number;
}

export class AIPlayerManager {
  private aiPlayers: Map<string, AIPlayerInstance> = new Map();
  private discussionTimer: NodeJS.Timeout | null = null;

  /**
   * AIプレイヤーを初期化
   */
  initializeAIPlayer(player: Player): void {
    if (!player.isBot || !player.role) return;

    const personality = getPersonalityForRole(player.role.name, player.role.faction);
    const engine = new AIPlayerEngine(personality);
    
    this.aiPlayers.set(player.id, {
      playerId: player.id,
      engine,
      lastActionTime: Date.now()
    });

    console.log(`AI Player initialized: ${player.name} with personality: ${personality.name}`);
  }

  /**
   * 議論フェーズでのAI発言を開始
   */
  startDiscussionPhase(gameState: GameState, onMessage: (playerId: string, message: string) => void): void {
    if (this.discussionTimer) {
      clearInterval(this.discussionTimer);
    }

    // 30-90秒間隔でランダムにAIが発言
    this.discussionTimer = setInterval(async () => {
      await this.triggerRandomAIMessage(gameState, onMessage);
    }, this.getRandomInterval(30000, 90000));
  }

  /**
   * 議論フェーズを停止
   */
  stopDiscussionPhase(): void {
    if (this.discussionTimer) {
      clearInterval(this.discussionTimer);
      this.discussionTimer = null;
    }
  }

  /**
   * ランダムなAIプレイヤーに発言させる
   */
  private async triggerRandomAIMessage(
    gameState: GameState, 
    onMessage: (playerId: string, message: string) => void
  ): Promise<void> {
    const aliveAIPlayers = Array.from(this.aiPlayers.values()).filter(ai => {
      const player = gameState.players.find(p => p.id === ai.playerId);
      return player && player.status === 'alive';
    });

    if (aliveAIPlayers.length === 0) return;

    // 最後に発言してから時間が経っているAIを優先
    const now = Date.now();
    const sortedAIs = aliveAIPlayers.sort((a, b) => a.lastActionTime - b.lastActionTime);
    
    const selectedAI = sortedAIs[0];
    const player = gameState.players.find(p => p.id === selectedAI.playerId);
    
    if (!player) return;

    try {
      const message = await selectedAI.engine.generateDiscussionMessage(
        gameState,
        player,
        this.getRecentMessages(gameState)
      );

      if (message && message.trim()) {
        onMessage(selectedAI.playerId, message);
        selectedAI.lastActionTime = now;
      }
    } catch (error) {
      console.error(`AI message generation failed for ${player.name}:`, error);
    }
  }

  /**
   * すべてのAIの夜行動を決定
   */
  async executeNightActions(gameState: GameState): Promise<Array<{playerId: string, targetId: string, actionType: string}>> {
    const nightActions: Array<{playerId: string, targetId: string, actionType: string}> = [];

    for (const [playerId, aiInstance] of this.aiPlayers) {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player || player.status !== 'alive' || !player.role) continue;

      try {
        const targetId = await aiInstance.engine.decideNightAction(gameState, player);
        if (targetId) {
          let actionType = '';
          
          switch (player.role.name) {
            case 'ai':
              actionType = 'attack';
              break;
            case 'engineer':
              actionType = 'investigate';
              break;
            case 'cyber_guard':
              actionType = 'protect';
              break;
          }

          if (actionType) {
            nightActions.push({ playerId, targetId, actionType });
          }
        }
      } catch (error) {
        console.error(`Night action decision failed for ${player.name}:`, error);
      }
    }

    return nightActions;
  }

  /**
   * すべてのAIの投票を決定
   */
  async executeVoting(gameState: GameState): Promise<Array<{playerId: string, targetId: string}>> {
    const votes: Array<{playerId: string, targetId: string}> = [];

    for (const [playerId, aiInstance] of this.aiPlayers) {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player || player.status !== 'alive') continue;

      try {
        const targetId = await aiInstance.engine.decideVote(gameState, player);
        if (targetId) {
          votes.push({ playerId, targetId });
        }
      } catch (error) {
        console.error(`Vote decision failed for ${player.name}:`, error);
      }
    }

    return votes;
  }

  /**
   * チャットメッセージをAIに学習させる
   */
  processChatMessage(message: ChatMessage, gameState: GameState): void {
    const sender = gameState.players.find(p => p.id === message.playerId);
    if (!sender) return;

    // すべてのAIプレイヤーに他者の発言を学習させる
    for (const [playerId, aiInstance] of this.aiPlayers) {
      if (playerId !== message.playerId) {
        aiInstance.engine.addToConversationHistory(sender.name, message.content);
        
        // 疑わしい発言や協力的な発言を記録
        if (message.content.includes('怪しい') || message.content.includes('疑う')) {
          aiInstance.engine.updateMemory(message.playerId, '疑いをかける', message.content);
        } else if (message.content.includes('同意') || message.content.includes('協力')) {
          aiInstance.engine.updateMemory(message.playerId, '協力的', message.content);
        }
      }
    }
  }

  /**
   * 最近のメッセージを取得（簡易版）
   */
  private getRecentMessages(gameState: GameState): string[] {
    // TODO: 実際のチャット履歴から取得するように修正
    return [];
  }

  /**
   * ランダムな間隔を生成
   */
  private getRandomInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 特定のAIに発言を促す
   */
  async promptAIMessage(
    playerId: string, 
    gameState: GameState,
    context?: string
  ): Promise<string | null> {
    const aiInstance = this.aiPlayers.get(playerId);
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!aiInstance || !player) return null;

    try {
      return await aiInstance.engine.generateDiscussionMessage(
        gameState,
        player,
        this.getRecentMessages(gameState)
      );
    } catch (error) {
      console.error(`Failed to prompt AI message for ${player.name}:`, error);
      return null;
    }
  }

  /**
   * AIプレイヤーの削除
   */
  removeAIPlayer(playerId: string): void {
    this.aiPlayers.delete(playerId);
  }

  /**
   * すべてのAIプレイヤーをクリア
   */
  clear(): void {
    this.stopDiscussionPhase();
    this.aiPlayers.clear();
  }

  /**
   * アクティブなAIプレイヤー数を取得
   */
  getActiveAICount(): number {
    return this.aiPlayers.size;
  }
}