import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const startSearch = () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    setIsSearching(true);
    setSearchTime(0);

    // TODO: 実際のマッチング処理を実装
    // 今は10秒後に自動的にAIルームを作成
    setTimeout(() => {
      const mockRoomSettings = {
        roomName: 'クイックマッチ',
        maxPlayers: 8,
        password: '',
        isPrivate: false,
        nightDuration: 180,
        dayDuration: 300,
        voteDuration: 90,
        roles: {
          ai: 2,
          engineer: 1,
          cyberGuard: 1,
          citizen: 3,
          trickster: 1
        }
      };

      navigate('/waiting-room', {
        state: {
          roomSettings: mockRoomSettings,
          playerName,
          isHost: false
        }
      });
    }, 10000);
  };

  const cancelSearch = () => {
    setIsSearching(false);
    setSearchTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← メインメニューに戻る
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">クイックマッチ</h1>
          <p className="text-gray-300">他のプレイヤーとランダムマッチング</p>
        </div>

        {!isSearching ? (
          <div className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                プレイヤー名 *
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="名前を入力してください"
                className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && startSearch()}
              />
            </div>

            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
              <h3 className="font-bold text-blue-300 mb-2">マッチング設定</h3>
              <div className="text-sm text-blue-100 space-y-1">
                <div>• プレイヤー数: 6-10人</div>
                <div>• ランクマッチ対応</div>
                <div>• バランス調整済み役職配分</div>
                <div>• AIプレイヤー自動補完</div>
              </div>
            </div>

            <button
              onClick={startSearch}
              disabled={!playerName.trim()}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                !playerName.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
              }`}
            >
              🎮 マッチング開始
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                マッチング中...
              </div>
              <div className="text-lg text-gray-300">
                {formatTime(searchTime)}
              </div>
            </div>

            <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-500/50">
              <h3 className="font-bold text-yellow-300 mb-2">📊 現在の状況</h3>
              <div className="text-sm text-yellow-100 space-y-1">
                <div>• 適切な対戦相手を検索中</div>
                <div>• レーティングを考慮してマッチング</div>
                <div>• 30秒以上かかる場合はAI戦を開始</div>
              </div>
            </div>

            <button
              onClick={cancelSearch}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
            >
              キャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickMatchPage;