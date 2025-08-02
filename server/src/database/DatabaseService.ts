import { PrismaClient, User, Game, GameParticipation, ChatMessage, PlayerStats } from '@prisma/client';
import { GameState, Player, RoleName, Faction } from '@project-jin/shared';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
    console.log('Database connected successfully');
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // ユーザー管理
  async createUser(name: string, email?: string): Promise<User> {
    return await this.prisma.user.create({
      data: {
        name,
        email,
      },
    });
  }

  async getUserByName(name: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { name },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUserRating(userId: string, newRating: number, ratingDeviation: number, volatility: number): Promise<User> {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        rating: newRating,
        ratingDeviation,
        volatility,
      },
    });
  }

  // ゲーム管理
  async createGame(playerCount: number): Promise<Game> {
    return await this.prisma.game.create({
      data: {
        playerCount,
        status: 'WAITING',
      },
    });
  }

  async getGame(gameId: string): Promise<Game | null> {
    return await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        participants: true,
        chatMessages: {
          include: {
            reactions: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        nightActions: true,
        votes: true,
      },
    });
  }

  async updateGameStatus(gameId: string, status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'): Promise<Game> {
    return await this.prisma.game.update({
      where: { id: gameId },
      data: { status },
    });
  }

  async updateGamePhase(gameId: string, phase: 'NIGHT' | 'DAY_REPORT' | 'DAY_DISCUSSION' | 'DAY_VOTE' | 'EXECUTION', turn: number): Promise<Game> {
    return await this.prisma.game.update({
      where: { id: gameId },
      data: { phase, turn },
    });
  }

  async finishGame(gameId: string, winner: string): Promise<Game> {
    return await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'FINISHED',
        winner,
        endedAt: new Date(),
      },
    });
  }

  // プレイヤー参加管理
  async addPlayerToGame(
    gameId: string,
    playerName: string,
    userId?: string,
    isBot: boolean = false
  ): Promise<GameParticipation> {
    return await this.prisma.gameParticipation.create({
      data: {
        gameId,
        userId,
        playerName,
        isBot,
      },
    });
  }

  async updatePlayerRole(
    gameId: string,
    playerName: string,
    role: RoleName,
    faction: Faction
  ): Promise<void> {
    // RoleNameとFactionを文字列に変換
    const roleString = role.toUpperCase();
    const factionString = faction.toUpperCase();

    await this.prisma.gameParticipation.updateMany({
      where: {
        gameId,
        playerName,
      },
      data: {
        role: roleString,
        faction: factionString,
      },
    });
  }

  async eliminatePlayer(
    gameId: string,
    playerName: string,
    reason: 'vote' | 'attack' | 'disconnect'
  ): Promise<void> {
    await this.prisma.gameParticipation.updateMany({
      where: {
        gameId,
        playerName,
      },
      data: {
        status: 'DEAD',
        eliminatedAt: new Date(),
        eliminationReason: reason,
      },
    });
  }

  // チャットメッセージ管理
  async saveChatMessage(
    gameId: string,
    content: string,
    phase: 'NIGHT' | 'DAY_REPORT' | 'DAY_DISCUSSION' | 'DAY_VOTE' | 'EXECUTION',
    turn: number,
    userId?: string,
    playerName?: string,
    isSystem: boolean = false
  ): Promise<ChatMessage> {
    return await this.prisma.chatMessage.create({
      data: {
        gameId,
        userId,
        playerName,
        content,
        phase,
        turn,
        isSystem,
      },
    });
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      update: {},
      create: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await this.prisma.messageReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji,
      },
    });
  }

  // 夜行動管理
  async saveNightAction(
    gameId: string,
    playerId: string,
    targetId: string | null,
    actionType: 'INVESTIGATE' | 'PROTECT' | 'ATTACK',
    turn: number,
    result?: string
  ): Promise<void> {
    await this.prisma.nightAction.upsert({
      where: {
        gameId_playerId_turn: {
          gameId,
          playerId,
          turn,
        },
      },
      update: {
        targetId,
        actionType,
        result,
      },
      create: {
        gameId,
        playerId,
        targetId,
        actionType,
        turn,
        result,
      },
    });
  }

  // 投票管理
  async saveVote(gameId: string, voterId: string, targetId: string, turn: number): Promise<void> {
    await this.prisma.vote.upsert({
      where: {
        gameId_voterId_turn: {
          gameId,
          voterId,
          turn,
        },
      },
      update: {
        targetId,
      },
      create: {
        gameId,
        voterId,
        targetId,
        turn,
      },
    });
  }

  // リプレイ保存
  async saveGameReplay(gameId: string, replayData: any): Promise<void> {
    await this.prisma.gameReplay.upsert({
      where: { gameId },
      update: {
        data: JSON.stringify(replayData),
      },
      create: {
        gameId,
        data: JSON.stringify(replayData),
      },
    });
  }

  // 統計情報
  async updatePlayerStats(userId: string, role: RoleName, won: boolean): Promise<void> {
    const roleString = role.toUpperCase() as 'ENGINEER' | 'CYBER_GUARD' | 'CITIZEN' | 'AI' | 'FAKE_AI' | 'TRICKSTER';
    
    await this.prisma.playerStats.upsert({
      where: {
        userId_role: {
          userId,
          role: roleString,
        },
      },
      update: {
        gamesPlayed: {
          increment: 1,
        },
        gamesWon: {
          increment: won ? 1 : 0,
        },
        winRate: {
          set: won ? 1 : 0, // 再計算が必要
        },
      },
      create: {
        userId,
        role: roleString,
        gamesPlayed: 1,
        gamesWon: won ? 1 : 0,
        winRate: won ? 1 : 0,
      },
    });
  }

  async updateUserGameStats(userId: string, won: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        gamesPlayed: {
          increment: 1,
        },
        gamesWon: {
          increment: won ? 1 : 0,
        },
      },
    });
  }

  // 検索・フィルタリング
  async searchGames(limit: number = 20): Promise<Game[]> {
    return await this.prisma.game.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        participants: true,
      },
    });
  }

  async getUserGameHistory(userId: string, limit: number = 10): Promise<Game[]> {
    return await this.prisma.game.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        participants: true,
      },
    });
  }

  async getUserStats(userId: string): Promise<{
    totalGames: number;
    totalWins: number;
    winRate: number;
    rating: number;
    roleStats: PlayerStats[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const roleStats = await this.prisma.playerStats.findMany({
      where: { userId },
    });

    return {
      totalGames: user?.gamesPlayed || 0,
      totalWins: user?.gamesWon || 0,
      winRate: user?.gamesPlayed ? (user?.gamesWon || 0) / user.gamesPlayed : 0,
      rating: user?.rating || 1000,
      roleStats,
    };
  }

  // フレンド機能
  async addFriend(userId: string, friendId: string): Promise<void> {
    await this.prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'PENDING',
      },
    });
  }

  async acceptFriend(userId: string, friendId: string): Promise<void> {
    await this.prisma.friendship.updateMany({
      where: {
        userId: friendId,
        friendId: userId,
        status: 'PENDING',
      },
      data: {
        status: 'ACCEPTED',
      },
    });
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: true,
        friend: true,
      },
    });

    return friendships.map(f => f.userId === userId ? f.friend : f.user);
  }

  // デイリー統計
  async updateDailyStats(date: Date): Promise<void> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [totalGames, totalUsers] = await Promise.all([
      this.prisma.game.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      }),
    ]);

    await this.prisma.dailyStats.upsert({
      where: { date: dayStart },
      update: {
        totalGames,
        totalUsers,
      },
      create: {
        date: dayStart,
        totalGames,
        totalUsers,
      },
    });
  }
}