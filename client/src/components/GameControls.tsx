import { useState } from 'react';
import { GameState } from '@project-jin/shared';
import { socketService } from '../services/socket';
import { useGameStore } from '../store/gameStore';

interface GameControlsProps {
  gameState: GameState;
}

export function GameControls({ gameState }: GameControlsProps) {
  const { currentPlayer } = useGameStore();
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  
  const socket = socketService.getSocket();

  const startGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  const executeNightAction = () => {
    if (!socket || !selectedTarget || !currentPlayer) return;

    const actionType = currentPlayer.role?.name === 'engineer' ? 'investigate' : 
                      currentPlayer.role?.name === 'cyber_guard' ? 'protect' : 
                      currentPlayer.role?.name === 'ai' ? 'attack' : null;

    if (actionType) {
      socket.emit('nightAction', {
        playerId: currentPlayer.id,
        targetId: selectedTarget,
        actionType
      });
      setSelectedTarget('');
    }
  };

  const vote = () => {
    if (!socket || !selectedTarget) return;
    socket.emit('vote', selectedTarget);
    setSelectedTarget('');
  };

  const alivePlayers = gameState.players.filter(p => p.status === 'alive' && p.id !== currentPlayer?.id);

  if (!gameState.isFinished && gameState.players.length >= 5 && gameState.turn === 1 && gameState.phase === 'night') {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <button
          onClick={startGame}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md font-medium transition"
        >
          ゲームを開始
        </button>
      </div>
    );
  }

  if (gameState.phase === 'night' && currentPlayer?.status === 'alive' && 
      ['engineer', 'cyber_guard', 'ai'].includes(currentPlayer.role?.name || '')) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold">夜のアクション</h3>
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
        >
          <option value="">対象を選択...</option>
          {alivePlayers.map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
        <button
          onClick={executeNightAction}
          disabled={!selectedTarget}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition"
        >
          {currentPlayer.role?.name === 'engineer' ? '調査する' :
           currentPlayer.role?.name === 'cyber_guard' ? '護衛する' :
           '襲撃する'}
        </button>
      </div>
    );
  }

  if (gameState.phase === 'day_vote' && currentPlayer?.status === 'alive') {
    return (
      <div className="bg-gray-800 p-4 rounded-lg space-y-3">
        <h3 className="font-semibold">投票</h3>
        <select
          value={selectedTarget}
          onChange={(e) => setSelectedTarget(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
        >
          <option value="">投票先を選択...</option>
          {alivePlayers.map(player => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>
        <button
          onClick={vote}
          disabled={!selectedTarget}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-md font-medium transition"
        >
          投票する
        </button>
      </div>
    );
  }

  return null;
}