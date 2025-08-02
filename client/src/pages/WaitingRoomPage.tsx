import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  isAI: boolean;
}

interface RoomSettings {
  roomName: string;
  maxPlayers: number;
  password: string;
  isPrivate: boolean;
  nightDuration: number;
  dayDuration: number;
  voteDuration: number;
  roles: {
    ai: number;
    engineer: number;
    cyberGuard: number;
    citizen: number;
    trickster: number;
  };
}

const WaitingRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ルーム設定とプレイヤー情報を取得
  const { roomSettings, playerName, isHost = false } = location.state as {
    roomSettings: RoomSettings;
    playerName: string;
    isHost: boolean;
  };

  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: playerName,
      isReady: false,
      isHost: isHost,
      isAI: false
    }
  ]);

  const [isReady, setIsReady] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    playerName: string;
    message: string;
    timestamp: Date;
    isSystem?: boolean;
  }>>([
    {
      playerName: 'System',
      message: `${playerName}がルームに参加しました`,
      timestamp: new Date(),
      isSystem: true
    }
  ]);

  const getRoomCode = () => {
    // 実際の実装では、サーバーから取得したルームIDを使用
    return 'ABC123';
  };

  const addAIPlayer = () => {
    if (players.length >= roomSettings.maxPlayers) return;
    
    const aiNames = ['ALI-CE', 'BOB-2', 'CHAR-7', 'DATA-9', 'EVE-X', 'FELIX', 'GAMMA'];
    const usedNames = players.map(p => p.name);
    const availableNames = aiNames.filter(name => !usedNames.includes(name));
    
    if (availableNames.length === 0) return;

    const newAI: Player = {
      id: `ai-${Date.now()}`,
      name: availableNames[0],
      isReady: true,
      isHost: false,
      isAI: true
    };

    setPlayers(prev => [...prev, newAI]);
    setChatHistory(prev => [...prev, {
      playerName: 'System',
      message: `AIプレイヤー ${newAI.name} が参加しました`,
      timestamp: new Date(),
      isSystem: true
    }]);
  };

  const removeAIPlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player || !player.isAI) return;

    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setChatHistory(prev => [...prev, {
      playerName: 'System',
      message: `AIプレイヤー ${player.name} が退出しました`,
      timestamp: new Date(),
      isSystem: true
    }]);
  };

  const toggleReady = () => {
    setIsReady(!isReady);
    setPlayers(prev => prev.map(p => 
      p.name === playerName ? { ...p, isReady: !isReady } : p
    ));
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;

    setChatHistory(prev => [...prev, {
      playerName: playerName,
      message: chatMessage,
      timestamp: new Date()
    }]);
    setChatMessage('');
  };

  const canStartGame = () => {
    const readyCount = players.filter(p => p.isReady).length;
    return players.length >= 5 && readyCount === players.length && players.length === roomSettings.maxPlayers;
  };

  const startGame = () => {
    if (!canStartGame()) return;
    
    // TODO: サーバーにゲーム開始リクエストを送信
    navigate('/game', { 
      state: { 
        roomSettings, 
        players,
        playerName 
      } 
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(getRoomCode());
    // TODO: トースト通知を表示
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{roomSettings.roomName}</h1>
              <p className="text-gray-300">ゲーム開始を待機中...</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-black/50 px-4 py-2 rounded-lg">
                <span className="text-gray-300">ルームコード: </span>
                <span className="text-white font-mono font-bold">{getRoomCode()}</span>
                <button
                  onClick={copyRoomCode}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                  title="コピー"
                >
                  📋
                </button>
              </div>
              <button
                onClick={() => navigate('/')}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                退出
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* プレイヤーリスト */}
            <div className="lg:col-span-1">
              <div className="bg-black/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    プレイヤー ({players.length}/{roomSettings.maxPlayers})
                  </h3>
                  {isHost && players.length < roomSettings.maxPlayers && (
                    <button
                      onClick={addAIPlayer}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                    >
                      AI追加
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border-2 ${
                        player.isReady
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-gray-900/30 border-gray-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            player.isReady ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          <div>
                            <div className="text-white font-semibold flex items-center space-x-2">
                              <span>{player.name}</span>
                              {player.isHost && <span className="text-yellow-400">👑</span>}
                              {player.isAI && <span className="text-blue-400">🤖</span>}
                            </div>
                            <div className="text-sm text-gray-300">
                              {player.isReady ? '準備完了' : '準備中...'}
                            </div>
                          </div>
                        </div>
                        {isHost && player.isAI && (
                          <button
                            onClick={() => removeAIPlayer(player.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 空きスロット表示 */}
                  {Array.from({ length: roomSettings.maxPlayers - players.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="p-3 rounded-lg border-2 border-dashed border-gray-600 bg-gray-900/20">
                      <div className="text-gray-500 text-center">待機中...</div>
                    </div>
                  ))}
                </div>

                {/* 準備ボタン */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={toggleReady}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      isReady
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    {isReady ? '✅ 準備完了' : '⏳ 準備する'}
                  </button>

                  {/* ゲーム開始ボタン（ホストのみ） */}
                  {isHost && (
                    <button
                      onClick={startGame}
                      disabled={!canStartGame()}
                      className={`w-full py-3 rounded-lg font-bold transition-all ${
                        canStartGame()
                          ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      🚀 ゲーム開始
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* チャット・ルーム設定 */}
            <div className="lg:col-span-2 space-y-6">
              {/* チャット */}
              <div className="bg-black/20 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-4">チャット</h3>
                
                <div className="bg-black/30 rounded-lg p-4 h-40 overflow-y-auto mb-4">
                  {chatHistory.map((chat, index) => (
                    <div key={index} className="mb-2">
                      <div className={`text-sm ${
                        chat.isSystem 
                          ? 'text-yellow-400 italic' 
                          : 'text-gray-300'
                      }`}>
                        <span className="font-semibold">{chat.playerName}:</span> {chat.message}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="メッセージを入力..."
                    className="flex-1 p-2 bg-black/50 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    送信
                  </button>
                </div>
              </div>

              {/* ルーム設定表示 */}
              <div className="bg-black/20 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-4">ルーム設定</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">時間設定</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div>夜フェーズ: {roomSettings.nightDuration}秒</div>
                      <div>昼フェーズ: {roomSettings.dayDuration}秒</div>
                      <div>投票フェーズ: {roomSettings.voteDuration}秒</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-2">役職配分</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div>🤖 AI: {roomSettings.roles.ai}人</div>
                      <div>🔍 エンジニア: {roomSettings.roles.engineer}人</div>
                      <div>🛡️ サイバーガード: {roomSettings.roles.cyberGuard}人</div>
                      <div>👤 市民: {roomSettings.roles.citizen}人</div>
                      <div>🎭 トリックスター: {roomSettings.roles.trickster}人</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomPage;