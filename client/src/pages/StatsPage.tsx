import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserStats {
  totalGames: number;
  totalWins: number;
  winRate: number;
  rating: number;
  roleStats: Array<{
    role: string;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
  }>;
}

interface GameHistory {
  id: string;
  status: string;
  winner?: string;
  playerCount: number;
  createdAt: string;
  endedAt?: string;
  participants: Array<{
    playerName: string;
    role?: string;
    faction?: string;
    status: string;
  }>;
}

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'personal' | 'history' | 'leaderboard'>('personal');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // ユーザーIDを取得（実際の実装では認証システムから取得）
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [showLogin, setShowLogin] = useState(!userId);
  const [loginName, setLoginName] = useState('');

  useEffect(() => {
    if (activeTab === 'personal' && userId) {
      fetchUserStats();
    } else if (activeTab === 'history') {
      fetchGameHistory();
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [activeTab, userId]);

  const fetchUserStats = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGameHistory = async () => {
    setIsLoading(true);
    try {
      const endpoint = userId 
        ? `/api/users/${userId}/history?limit=20`
        : '/api/games/history?limit=20';
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const games = await response.json();
        setGameHistory(games);
      }
    } catch (error) {
      console.error('Failed to fetch game history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName: loginName })
      });
      
      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('userName', userData.name);
        setUserId(userData.userId);
        setUserName(userData.name);
        setShowLogin(false);
        setActiveTab('personal'); // 個人統計タブに切り替え
      } else {
        alert('ログインに失敗しました');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('ログインに失敗しました');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setUserId('');
    setUserName('');
    setShowLogin(true);
    setActiveTab('history'); // 履歴タブに切り替え
  };

  const viewReplay = (gameId: string) => {
    navigate(`/replay/${gameId}`);
  };

  const getRoleIcon = (role: string) => {
    const roleIcons: { [key: string]: string } = {
      'AI': '🤖',
      'ENGINEER': '🔍',
      'CYBER_GUARD': '🛡️',
      'CITIZEN': '👤',
      'FAKE_AI': '🎭',
      'TRICKSTER': '🃏'
    };
    return roleIcons[role] || '❓';
  };

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'HUMAN': return 'text-blue-400';
      case 'AI': return 'text-red-400';
      case 'THIRD': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">📊 統計・戦績</h1>
            <div className="flex items-center space-x-4">
              {userId && (
                <div className="text-right">
                  <div className="text-white font-semibold">{userName}</div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    ログアウト
                  </button>
                </div>
              )}
              <button
                onClick={() => navigate('/')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                メニューに戻る
              </button>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-2 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'personal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-300 hover:text-white'
              }`}
              disabled={!userId}
            >
              個人統計
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-300 hover:text-white'
              }`}
            >
              ゲーム履歴
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-transparent text-gray-300 hover:text-white'
              }`}
            >
              ランキング
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
              <p className="text-gray-300 mt-4">読み込み中...</p>
            </div>
          ) : (
            <>
              {/* 個人統計 */}
              {activeTab === 'personal' && !userId && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👤</div>
                  <div className="text-white text-xl mb-4">個人統計を見るにはログインが必要です</div>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ログイン
                  </button>
                </div>
              )}
              
              {activeTab === 'personal' && userId && !userStats && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📈</div>
                  <div className="text-white text-xl mb-4">まだゲームをプレイしていません</div>
                  <div className="text-gray-300 mb-6">ゲームをプレイして統計を蓄積しましょう！</div>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ゲームを始める
                  </button>
                </div>
              )}
              
              {activeTab === 'personal' && userId && userStats && (
                <div className="space-y-6">
                  {/* 総合統計 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-white">{userStats.totalGames}</div>
                      <div className="text-gray-300">総ゲーム数</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-green-400">{userStats.totalWins}</div>
                      <div className="text-gray-300">勝利数</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-400">
                        {(userStats.winRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-gray-300">勝率</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-purple-400">{Math.round(userStats.rating)}</div>
                      <div className="text-gray-300">レーティング</div>
                    </div>
                  </div>

                  {/* 役職別統計 */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">役職別戦績</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userStats.roleStats.map(stat => (
                        <div key={stat.role} className="bg-black/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getRoleIcon(stat.role)}</span>
                              <span className="text-white font-semibold">
                                {stat.role.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-300">
                                {stat.gamesWon}/{stat.gamesPlayed}
                              </div>
                              <div className="text-lg font-bold text-green-400">
                                {(stat.winRate * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${stat.winRate * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ゲーム履歴 */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {gameHistory.map(game => (
                    <div key={game.id} className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-white font-semibold">
                            {new Date(game.createdAt).toLocaleString('ja-JP')}
                          </div>
                          <div className="text-sm text-gray-300">
                            {game.playerCount}人プレイ • 
                            {game.winner && `${game.winner === 'human' ? '人間' : game.winner === 'ai' ? 'AI' : '第三'}陣営勝利`}
                          </div>
                        </div>
                        <button
                          onClick={() => viewReplay(game.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                          リプレイ
                        </button>
                      </div>

                      {/* 参加者一覧 */}
                      {selectedGame === game.id && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {game.participants.map((participant, idx) => (
                              <div 
                                key={idx}
                                className={`text-sm ${
                                  participant.status === 'ALIVE' ? 'text-green-400' : 'text-gray-500'
                                }`}
                              >
                                <span className="mr-1">{getRoleIcon(participant.role || '')}</span>
                                <span className={getFactionColor(participant.faction || '')}>
                                  {participant.playerName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedGame(selectedGame === game.id ? null : game.id)}
                        className="text-sm text-blue-400 hover:text-blue-300 mt-2"
                      >
                        {selectedGame === game.id ? '詳細を隠す' : '詳細を見る'}
                      </button>
                    </div>
                  ))}

                  {gameHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      ゲーム履歴がありません
                    </div>
                  )}
                </div>
              )}

              {/* ランキング */}
              {activeTab === 'leaderboard' && (
                <div>
                  <div className="bg-black/20 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-black/30">
                          <th className="text-left text-white p-4">順位</th>
                          <th className="text-left text-white p-4">プレイヤー</th>
                          <th className="text-center text-white p-4">レーティング</th>
                          <th className="text-center text-white p-4">勝率</th>
                          <th className="text-center text-white p-4">ゲーム数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((player, index) => (
                          <tr key={player.id} className="border-t border-gray-700">
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                {index === 0 && <span className="text-2xl">🥇</span>}
                                {index === 1 && <span className="text-2xl">🥈</span>}
                                {index === 2 && <span className="text-2xl">🥉</span>}
                                {index > 2 && <span className="text-gray-400">#{index + 1}</span>}
                              </div>
                            </td>
                            <td className="p-4 text-white font-semibold">{player.name}</td>
                            <td className="p-4 text-center text-purple-400 font-bold">
                              {Math.round(player.rating)}
                            </td>
                            <td className="p-4 text-center text-green-400">
                              {(player.winRate * 100).toFixed(1)}%
                            </td>
                            <td className="p-4 text-center text-gray-300">{player.gamesPlayed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {leaderboard.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        ランキングデータがありません
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ログインモーダル */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">プレイヤー認証</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  プレイヤー名
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="ゲームで使用する名前を入力"
                  className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  maxLength={20}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleLogin}
                  disabled={!loginName.trim()}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    !loginName.trim()
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  ログイン
                </button>
                <button
                  onClick={() => setShowLogin(false)}
                  className="flex-1 py-3 rounded-lg font-bold bg-gray-600 text-white hover:bg-gray-700 transition-all"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPage;