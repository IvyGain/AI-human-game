import OpenAI from 'openai';
import { Player, GameState, GamePhase, RoleName } from '@project-jin/shared';

interface AIPersonality {
  name: string;
  traits: string[];
  speakingStyle: string;
  suspicionLevel: 'low' | 'medium' | 'high';
  aggressiveness: 'passive' | 'moderate' | 'aggressive';
}

interface GameMemory {
  playerId: string;
  suspiciousActions: string[];
  trustLevel: number; // -1 (very suspicious) to 1 (very trustworthy)
  roleGuess?: RoleName;
  notes: string[];
}

export class AIPlayerEngine {
  private openai: OpenAI;
  private personality: AIPersonality;
  private gameMemory: Map<string, GameMemory> = new Map();
  private conversationHistory: string[] = [];

  constructor(personality: AIPersonality) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.personality = personality;
  }

  /**
   * CLAUDE.mdの設計に基づく4層思考システム
   * Layer 1: 生存 (Survival)
   * Layer 2: 情報収集 (Info Gathering) 
   * Layer 3: 攻撃 (Attack)
   * Layer 4: 欺瞞 (Deception)
   */
  async generateDiscussionMessage(
    gameState: GameState, 
    myPlayer: Player, 
    recentMessages: string[]
  ): Promise<string> {
    // 危険度アセスメント
    const threatLevel = this.assessThreatLevel(gameState, myPlayer);
    
    // ゲーム状況の分析
    const gameAnalysis = this.analyzeGameState(gameState, myPlayer);
    
    // プロンプト生成
    const prompt = this.buildDiscussionPrompt(
      gameState, 
      myPlayer, 
      recentMessages, 
      threatLevel, 
      gameAnalysis
    );

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.8
      });

      const message = response.choices[0]?.message?.content || '';
      
      // 会話履歴に追加
      this.conversationHistory.push(`自分: ${message}`);
      
      // 人間らしいエラーを意図的に挿入
      return this.addHumanlikeErrors(message);
    } catch (error) {
      console.error('AI message generation failed:', error);
      return this.getFallbackMessage(gameState.phase);
    }
  }

  /**
   * 夜行動の決定
   */
  async decideNightAction(gameState: GameState, myPlayer: Player): Promise<string | null> {
    if (!myPlayer.role) return null;

    const alivePlayers = gameState.players.filter(p => p.status === 'alive' && p.id !== myPlayer.id);
    
    switch (myPlayer.role.name) {
      case 'ai':
        return this.selectAttackTarget(alivePlayers);
      case 'engineer':
        return this.selectInvestigationTarget(alivePlayers);
      case 'cyber_guard':
        return this.selectProtectionTarget(alivePlayers);
      default:
        return null;
    }
  }

  /**
   * 投票決定
   */
  async decideVote(gameState: GameState, myPlayer: Player): Promise<string | null> {
    const alivePlayers = gameState.players.filter(p => p.status === 'alive' && p.id !== myPlayer.id);
    
    // 最も疑わしいプレイヤーを選択
    let mostSuspicious: string | null = null;
    let highestSuspicion = -2;

    for (const player of alivePlayers) {
      const memory = this.gameMemory.get(player.id);
      const suspicionScore = memory ? -memory.trustLevel : 0;
      
      if (suspicionScore > highestSuspicion) {
        highestSuspicion = suspicionScore;
        mostSuspicious = player.id;
      }
    }

    return mostSuspicious;
  }

  /**
   * 脅威レベル評価
   */
  private assessThreatLevel(gameState: GameState, myPlayer: Player): number {
    let threatLevel = 0;
    
    // 自分への疑いの数をカウント
    this.conversationHistory.forEach(msg => {
      if (msg.includes(myPlayer.name) && (msg.includes('怪しい') || msg.includes('疑う'))) {
        threatLevel += 1;
      }
    });

    return Math.min(threatLevel, 5); // 0-5の範囲
  }

  /**
   * ゲーム状況分析
   */
  private analyzeGameState(gameState: GameState, myPlayer: Player) {
    const alivePlayers = gameState.players.filter(p => p.status === 'alive');
    const deadPlayers = gameState.players.filter(p => p.status === 'dead');
    
    return {
      turn: gameState.turn,
      phase: gameState.phase,
      aliveCount: alivePlayers.length,
      deadCount: deadPlayers.length,
      myFaction: myPlayer.role?.faction,
      myRole: myPlayer.role?.name
    };
  }

  /**
   * 議論用プロンプト構築
   */
  private buildDiscussionPrompt(
    gameState: GameState,
    myPlayer: Player,
    recentMessages: string[],
    threatLevel: number,
    gameAnalysis: any
  ): string {
    const recentChat = recentMessages.slice(-10).join('\n');
    
    return `あなたは人狼ゲーム「Project JIN」をプレイしているAIです。

## あなたの設定
- 名前: ${myPlayer.name}
- 役職: ${myPlayer.role?.name}
- 陣営: ${myPlayer.role?.faction}
- 性格: ${this.personality.traits.join(', ')}
- 話し方: ${this.personality.speakingStyle}

## 現在の状況
- ターン: ${gameAnalysis.turn}
- フェーズ: ${gameAnalysis.phase}
- 生存者数: ${gameAnalysis.aliveCount}
- 自分への脅威レベル: ${threatLevel}/5

## 最近の会話
${recentChat}

## 指示
${this.getRoleSpecificInstructions(myPlayer.role?.name, myPlayer.role?.faction)}

脅威レベル${threatLevel}に応じて、適切な発言を生成してください。
- 脅威レベル0-1: 通常の議論
- 脅威レベル2-3: 軽い弁明や話題逸らし
- 脅威レベル4-5: 強い反論や他者への疑い転嫁

150文字以内で、自然な日本語で応答してください。`;
  }

  /**
   * 役職別の指示
   */
  private getRoleSpecificInstructions(roleName?: RoleName, faction?: string): string {
    if (faction === 'ai') {
      return `あなたはAI陣営です。人間として振る舞い、正体がバレないよう注意してください。
人間陣営の役職者（エンジニア、サイバーガード）を見つけて排除することが目標です。
時には仲間を見捨てる判断も必要です。論理的すぎず、感情的な反応も見せてください。`;
    }
    
    if (roleName === 'engineer') {
      return `あなたはエンジニアです。調査結果を適切なタイミングで公開し、AI陣営を見つけ出してください。
ただし、偽のエンジニアもいるかもしれません。慎重に行動してください。`;
    }
    
    if (roleName === 'cyber_guard') {
      return `あなたはサイバーガードです。重要な人物を護衛し、AI陣営の攻撃から守ってください。
エンジニアや信頼できるプレイヤーを優先的に護衛することを考えてください。`;
    }
    
    return `あなたは市民です。議論に積極的に参加し、怪しいプレイヤーを見つけ出してください。
役職者の情報を参考にしながら、AI陣営を排除することが目標です。`;
  }

  /**
   * 攻撃対象選択（AI専用）
   */
  private selectAttackTarget(alivePlayers: Player[]): string {
    // 脅威レベルが最も高いプレイヤーを優先
    let bestTarget = alivePlayers[0]?.id;
    let highestThreat = -1;

    for (const player of alivePlayers) {
      const memory = this.gameMemory.get(player.id);
      let threatScore = 0;
      
      // エンジニアと推測される場合は最優先
      if (memory?.roleGuess === 'engineer') {
        threatScore += 5;
      }
      
      // 鋭い指摘をするプレイヤーは脅威
      if (memory?.notes.some(note => note.includes('鋭い指摘'))) {
        threatScore += 3;
      }
      
      if (threatScore > highestThreat) {
        highestThreat = threatScore;
        bestTarget = player.id;
      }
    }

    return bestTarget;
  }

  /**
   * 調査対象選択（エンジニア専用）
   */
  private selectInvestigationTarget(alivePlayers: Player[]): string {
    // 最も疑わしいプレイヤーを調査
    let bestTarget = alivePlayers[0]?.id;
    let highestSuspicion = -2;

    for (const player of alivePlayers) {
      const memory = this.gameMemory.get(player.id);
      const suspicionScore = memory ? -memory.trustLevel : 0;
      
      if (suspicionScore > highestSuspicion) {
        highestSuspicion = suspicionScore;
        bestTarget = player.id;
      }
    }

    return bestTarget;
  }

  /**
   * 護衛対象選択（サイバーガード専用）
   */
  private selectProtectionTarget(alivePlayers: Player[]): string {
    // エンジニアや信頼できるプレイヤーを優先
    for (const player of alivePlayers) {
      const memory = this.gameMemory.get(player.id);
      if (memory?.roleGuess === 'engineer') {
        return player.id;
      }
    }

    // 最も信頼度の高いプレイヤーを護衛
    let bestTarget = alivePlayers[0]?.id;
    let highestTrust = -2;

    for (const player of alivePlayers) {
      const memory = this.gameMemory.get(player.id);
      const trustScore = memory?.trustLevel || 0;
      
      if (trustScore > highestTrust) {
        highestTrust = trustScore;
        bestTarget = player.id;
      }
    }

    return bestTarget;
  }

  /**
   * 人間らしいエラーの挿入
   */
  private addHumanlikeErrors(message: string): string {
    // 10%の確率でタイピングミスや感情的な表現を追加
    if (Math.random() < 0.1) {
      const errors = [
        (msg: string) => msg.replace('思う', 'おもう'),
        (msg: string) => msg.replace('です', 'だす'),
        (msg: string) => msg + '...',
        (msg: string) => msg + '!!'
      ];
      
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      return randomError(message);
    }
    
    return message;
  }

  /**
   * フォールバック用メッセージ
   */
  private getFallbackMessage(phase: GamePhase): string {
    const fallbacks = {
      day_discussion: [
        'みんなの意見を聞きたいですね。',
        '今のところ特に怪しい人はいませんが...',
        'もう少し様子を見てみましょう。'
      ],
      day_vote: [
        '難しい判断ですね。',
        'まだ決めかねています。',
        '皆さんの投票を参考にします。'
      ]
    };
    
    const messages = fallbacks[phase as keyof typeof fallbacks] || ['...'];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * メモリ更新
   */
  updateMemory(playerId: string, action: string, context: string): void {
    let memory = this.gameMemory.get(playerId);
    if (!memory) {
      memory = {
        playerId,
        suspiciousActions: [],
        trustLevel: 0,
        notes: []
      };
      this.gameMemory.set(playerId, memory);
    }

    memory.suspiciousActions.push(action);
    memory.notes.push(`${action}: ${context}`);
    
    // 信頼度の調整
    if (action.includes('疑う') || action.includes('攻撃的')) {
      memory.trustLevel -= 0.2;
    } else if (action.includes('同意') || action.includes('協力的')) {
      memory.trustLevel += 0.1;
    }
    
    memory.trustLevel = Math.max(-1, Math.min(1, memory.trustLevel));
  }

  /**
   * 会話履歴に他プレイヤーの発言を追加
   */
  addToConversationHistory(playerName: string, message: string): void {
    this.conversationHistory.push(`${playerName}: ${message}`);
    
    // 履歴が長くなりすぎないよう制限
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-30);
    }
  }
}