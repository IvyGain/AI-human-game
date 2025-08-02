import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const createGame = async () => {
    if (!playerName.trim()) {
      alert('名前を入力してください');
      return;
    }
    
    setIsCreating(true);
    try {
      const { gameId } = await api.createGame();
      navigate(`/game/${gameId}?name=${encodeURIComponent(playerName)}`);
    } catch (error) {
      alert('ゲームの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const joinGame = () => {
    if (!gameId.trim() || !playerName.trim()) {
      alert('ゲームIDと名前を入力してください');
      return;
    }
    navigate(`/game/${gameId}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center mb-2">Project JIN</h1>
          <p className="text-center text-gray-400">最後に信じるのは、人間の直感か、AIの論理か。</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">プレイヤー名</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="名前を入力"
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={createGame}
              disabled={isCreating}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition"
            >
              {isCreating ? '作成中...' : '新しいゲームを作成'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">または</span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="ゲームIDを入力"
              />
              <button
                onClick={joinGame}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 rounded-md font-medium transition"
              >
                ゲームに参加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}