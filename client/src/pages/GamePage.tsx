import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socket';
import { ChatBox } from '../components/ChatBox';
import { PlayerList } from '../components/PlayerList';
import { GameControls } from '../components/GameControls';
import { PhaseDisplay } from '../components/PhaseDisplay';

export function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 新しいフローでは location.state から情報を取得
  const { roomSettings, players, playerName: statePlayerName } = location.state || {};
  const playerName = statePlayerName || searchParams.get('name');
  
  const { gameState, setGameState, setCurrentPlayer, addMessage, reset } = useGameStore();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 新しいフローでは gameId は不要
    if (!playerName) {
      navigate('/');
      return;
    }

    const socket = socketService.connect();
    
    socket.on('connect', () => {
      setIsConnected(true);
      // 新しいフローでは roomSettings と players を送信
      socket.emit('startGame', { roomSettings, players, playerName });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('gameState', (state) => {
      setGameState(state);
      const currentPlayer = state.players.find(p => p.name === playerName);
      if (currentPlayer) {
        setCurrentPlayer(currentPlayer);
      }
    });

    socket.on('playerJoined', (player) => {
      if (gameState) {
        const updatedState = {
          ...gameState,
          players: [...gameState.players, player]
        };
        setGameState(updatedState);
      }
    });

    socket.on('playerLeft', (playerId) => {
      if (gameState) {
        const updatedState = {
          ...gameState,
          players: gameState.players.filter(p => p.id !== playerId)
        };
        setGameState(updatedState);
      }
    });

    socket.on('chatMessage', (message) => {
      addMessage(message);
    });

    socket.on('phaseChange', (phase) => {
      if (gameState) {
        setGameState({ ...gameState, phase });
      }
    });

    socket.on('gameEnd', (winner, finalState) => {
      setGameState(finalState);
      alert(`ゲーム終了！ ${winner}陣営の勝利です！`);
    });

    socket.on('error', (message) => {
      alert(`エラー: ${message}`);
    });

    return () => {
      socket.emit('leaveGame');
      socketService.disconnect();
      reset();
    };
  }, [gameId, playerName]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>接続中...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>ゲーム情報を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Project JIN</h1>
          <p className="text-sm text-gray-400">
            {roomSettings?.roomName || 'ゲーム進行中'} - プレイヤー: {playerName}
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-red-400 hover:text-red-300 transition-colors text-sm"
          >
            ゲームを退出
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <PhaseDisplay gameState={gameState} />
            <GameControls gameState={gameState} />
            <ChatBox />
          </div>
          
          <div>
            <PlayerList players={gameState.players} />
          </div>
        </div>
      </div>
    </div>
  );
}