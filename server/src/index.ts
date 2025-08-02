import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { SocketHandler } from './websocket';
import { gameManager } from './game';
import { DatabaseService } from './database/DatabaseService.js';
import { RoomManager } from './room';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '@project-jin/shared';

dotenv.config();

const app = express();
const dbService = new DatabaseService();
const roomManager = new RoomManager();

// データベース接続を初期化
dbService.connect().catch(console.error);
const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true
  }
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeGames: gameManager.getActiveGamesCount(),
    activeRooms: roomManager.getActiveRoomsCount(),
    roomStats: roomManager.getStats()
  });
});

// Create new game endpoint
app.post('/api/games', (req, res) => {
  const gameId = gameManager.createGame();
  res.json({ gameId });
});

// Get game state endpoint
app.get('/api/games/:gameId', (req, res) => {
  const game = gameManager.getGame(req.params.gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json(game.getGameState());
});

// Add AI players endpoint
app.post('/api/games/:gameId/ai-players', (req, res) => {
  const game = gameManager.getGame(req.params.gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const { count = 3 } = req.body;
  const aiPlayers = game.addBotPlayers(Math.min(count, 5)); // 最大5体まで
  
  res.json({ 
    message: `${aiPlayers.length} AI players added`,
    players: aiPlayers 
  });
});

// Get chat history endpoint
app.get('/api/games/:gameId/chat', (req, res) => {
  const game = gameManager.getGame(req.params.gameId);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const chatHistory = game.getRecentChatMessages(limit);
  
  res.json({ messages: chatHistory });
});

// === ROOM MANAGEMENT ENDPOINTS ===

// Create room endpoint
app.post('/api/rooms', (req, res) => {
  try {
    const { settings, playerName } = req.body;
    
    if (!settings || !playerName) {
      res.status(400).json({ error: 'Settings and player name are required' });
      return;
    }

    // Note: socketId will be handled by WebSocket connection
    const room = roomManager.createRoom(settings, playerName, '');
    
    res.status(201).json({
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
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get public rooms endpoint
app.get('/api/rooms/public', (req, res) => {
  try {
    const rooms = roomManager.getPublicRooms();
    const roomsData = rooms.map(room => ({
      id: room.id,
      name: room.settings.roomName,
      hostName: room.players.find(p => p.isHost)?.name || 'Unknown',
      players: room.players.length,
      maxPlayers: room.settings.maxPlayers,
      isPrivate: room.settings.isPrivate,
      gameMode: 'スタンダード', // TODO: Add game mode to settings
      created: room.createdAt
    }));
    
    res.json({ rooms: roomsData });
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({ error: 'Failed to get public rooms' });
  }
});

// Get room by code endpoint
app.get('/api/rooms/code/:code', (req, res) => {
  try {
    const room = roomManager.getRoomByCode(req.params.code);
    
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json({
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
  } catch (error) {
    console.error('Get room by code error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Join room by code endpoint
app.post('/api/rooms/join/code', (req, res) => {
  try {
    const { code, playerName, password, isSpectator = false } = req.body;
    
    if (!code || !playerName) {
      res.status(400).json({ error: 'Code and player name are required' });
      return;
    }

    // Note: socketId will be handled by WebSocket connection
    const room = roomManager.joinRoomByCode(code, playerName, '', password, isSpectator);
    
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json({
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
  } catch (error: any) {
    console.error('Join room error:', error);
    res.status(400).json({ error: error.message || 'Failed to join room' });
  }
});

// Join room by ID endpoint
app.post('/api/rooms/join/:roomId', (req, res) => {
  try {
    const { playerName, password, isSpectator = false } = req.body;
    
    if (!playerName) {
      res.status(400).json({ error: 'Player name is required' });
      return;
    }

    // Note: socketId will be handled by WebSocket connection
    const room = roomManager.joinRoomById(req.params.roomId, playerName, '', password, isSpectator);
    
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json({
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
  } catch (error: any) {
    console.error('Join room error:', error);
    res.status(400).json({ error: error.message || 'Failed to join room' });
  }
});

// User management endpoints
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    const existingUser = await dbService.getUserByName(name);
    
    if (existingUser) {
      res.json(existingUser);
      return;
    }
    
    const user = await dbService.createUser(name, email);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:userId/stats', async (req, res) => {
  try {
    const stats = await dbService.getUserStats(req.params.userId);
    res.json(stats);
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/users/:userId/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await dbService.getUserGameHistory(req.params.userId, limit);
    res.json(history);
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
});

// Friend management
app.post('/api/users/:userId/friends', async (req, res) => {
  try {
    const { friendId } = req.body;
    await dbService.addFriend(req.params.userId, friendId);
    res.json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to add friend' });
  }
});

app.get('/api/users/:userId/friends', async (req, res) => {
  try {
    const friends = await dbService.getFriends(req.params.userId);
    res.json(friends);
  } catch (error) {
    res.status(404).json({ error: 'User not found' });
  }
});

// Game history and replays
app.get('/api/games/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const games = await dbService.searchGames(limit);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

app.get('/api/games/:gameId/replay', async (req, res) => {
  try {
    const game = await dbService.getGame(req.params.gameId);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch replay data' });
  }
});

// Statistics endpoints
app.get('/api/stats/daily', async (req, res) => {
  try {
    const today = new Date();
    await dbService.updateDailyStats(today);
    // TODO: 実際の統計データを返す実装
    res.json({ 
      date: today.toISOString().split('T')[0],
      totalGames: 0,
      totalUsers: 0,
      avgGameDuration: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    // TODO: レーティング上位プレイヤーのリストを返す実装
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Initialize WebSocket handler
new SocketHandler(io, roomManager);

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});