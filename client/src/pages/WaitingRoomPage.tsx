import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { socketService } from '../services/socket';

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  isAI: boolean;
  isSpectator: boolean;
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
  const { roomData, playerName, isHost = false, isSpectator = false } = location.state as {
    roomData: any;
    playerName: string;
    isHost: boolean;
    isSpectator?: boolean;
  };

  if (!roomData || !playerName) {
    console.log('ルームデータまたはプレイヤー名が不足しています。メニューに戻ります。');
    navigate('/');
    return null;
  }

  const [room, setRoom] = useState(roomData);
  const [isConnected, setIsConnected] = useState(false);

  const [isReady, setIsReady] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'chat' | 'system';
    playerName?: string;
    content: string;
    timestamp: Date;
  }>>([]);

  // WebSocket接続とイベントハンドリング
  useEffect(() => {
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      console.log('WebSocket接続成功');
      setIsConnected(true);
      // ルームに参加
      console.log(`ルーム参加試行: コード=${room.code}, プレイヤー=${playerName}, 観戦者=${isSpectator}`);
      socket.emit('joinRoom', room.code, playerName, undefined, isSpectator);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('roomUpdate', (data: { room: any }) => {
      setRoom(data.room);
      console.log('Room updated:', data.room);
    });

    socket.on('roomMessage', (message: any) => {
      setChatHistory(prev => [...prev, {
        type: message.type,
        playerName: message.playerName,
        content: message.content,
        timestamp: new Date(message.timestamp)
      }]);
    });

    socket.on('gameStarted', (data: { gameId: string; gameState: any }) => {
      console.log('Game started:', data);
      navigate('/game', {
        state: {
          gameId: data.gameId,
          gameState: data.gameState,
          playerName
        }
      });
    });

    socket.on('error', (message: string) => {
      console.error('WebSocketエラー:', message);
      
      // ルームが見つからない場合は、メニューに戻る
      if (message.includes('ルームが見つかりません') || message.includes('Room not found')) {
        console.log('ルームが見つからないため、メニューに戻ります');
        // 即座にWebSocket接続を切断してさらなるエラーを防ぐ
        socketService.disconnect();
        navigate('/');
      } else {
        alert(`エラー: ${message}`);
      }
    });

    return () => {
      socket.emit('leaveRoom');
      socketService.disconnect();
    };
  }, [room.code, playerName, navigate]);

  const getRoomCode = () => {
    return room.code;
  };

  const addAIPlayer = () => {
    if (!isConnected) {
      console.log('AI追加失敗: WebSocket未接続');
      return;
    }
    console.log('AI追加要求を送信中...');
    const socket = socketService.getSocket();
    socket?.emit('addAIPlayer');
  };

  const removeAIPlayer = (playerId: string) => {
    if (!isConnected) return;
    const socket = socketService.getSocket();
    socket?.emit('removeAIPlayer', playerId);
  };

  const toggleReady = () => {
    if (!isConnected) return;
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    const socket = socketService.getSocket();
    socket?.emit('setReady', newReadyState);
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !isConnected) return;
    
    const socket = socketService.getSocket();
    socket?.emit('sendRoomMessage', chatMessage);
    setChatMessage('');
  };

  const canStartGame = () => {
    if (!room || !room.players) return false;
    const readyCount = room.players.filter((p: any) => p.isReady).length;
    return room.players.length >= 5 && 
           readyCount === room.players.length && 
           room.players.length === room.settings.maxPlayers;
  };

  const startGame = () => {
    if (!canStartGame() || !isConnected) return;
    
    const socket = socketService.getSocket();
    socket?.emit('startRoomGame');
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
              <h1 className="text-2xl font-bold text-white">{room.settings?.roomName || 'ルーム'}</h1>
              <p className="text-gray-300">
                {isConnected ? 'ゲーム開始を待機中...' : '接続中...'}
              </p>
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
                    プレイヤー ({room.players?.length || 0}/{room.settings?.maxPlayers || 0})
                  </h3>
                  {isHost && !isSpectator && (room.players?.length || 0) < (room.settings?.maxPlayers || 0) && (
                    <button
                      onClick={addAIPlayer}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                    >
                      AI追加
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {(room.players || []).map((player: any) => (
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
                  {Array.from({ length: (room.settings?.maxPlayers || 0) - (room.players?.length || 0) }).map((_, index) => (
                    <div key={`empty-${index}`} className="p-3 rounded-lg border-2 border-dashed border-gray-600 bg-gray-900/20">
                      <div className="text-gray-500 text-center">待機中...</div>
                    </div>
                  ))}
                </div>

                {/* 観戦者リスト */}
                {(room.spectators && room.spectators.length > 0) && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      観戦者 ({room.spectators.length})
                    </h4>
                    <div className="space-y-2">
                      {room.spectators.map((spectator: any) => (
                        <div key={spectator.id} className="p-2 rounded-lg bg-purple-900/30 border border-purple-500/50">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-white font-medium">{spectator.name}</span>
                            <span className="text-purple-300">👁️</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 準備ボタン（観戦者以外） */}
                {!isSpectator && (
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
                )}

                {/* 観戦者用のメッセージ */}
                {isSpectator && (
                  <div className="mt-6">
                    <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 text-center">
                      <div className="text-purple-300 mb-2">👁️</div>
                      <div className="text-white font-semibold">観戦モード</div>
                      <div className="text-purple-200 text-sm mt-1">
                        ゲームの進行を観戦できます
                      </div>
                    </div>
                  </div>
                )}
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
                        chat.type === 'system' 
                          ? 'text-yellow-400 italic' 
                          : 'text-gray-300'
                      }`}>
                        {chat.type === 'system' ? (
                          <span>{chat.content}</span>
                        ) : (
                          <>
                            <span className="font-semibold">{chat.playerName}:</span> {chat.content}
                          </>
                        )}
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
                      <div>夜フェーズ: {room.settings?.nightDuration || 180}秒</div>
                      <div>昼フェーズ: {room.settings?.dayDuration || 300}秒</div>
                      <div>投票フェーズ: {room.settings?.voteDuration || 90}秒</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-2">役職配分</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div>🤖 AI: {room.settings?.roles?.ai || 0}人</div>
                      <div>🔍 エンジニア: {room.settings?.roles?.engineer || 0}人</div>
                      <div>🛡️ サイバーガード: {room.settings?.roles?.cyberGuard || 0}人</div>
                      <div>👤 市民: {room.settings?.roles?.citizen || 0}人</div>
                      <div>🎭 トリックスター: {room.settings?.roles?.trickster || 0}人</div>
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