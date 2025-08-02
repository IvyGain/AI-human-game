import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Room {
  id: string;
  name: string;
  hostName: string;
  players: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameMode: string;
  created: Date;
}

const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpectator, setIsSpectator] = useState(false);

  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 公開ルーム一覧を取得
  const fetchPublicRooms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rooms/public');
      if (response.ok) {
        const { rooms } = await response.json();
        setAvailableRooms(rooms);
      } else {
        console.error('Failed to fetch public rooms');
      }
    } catch (error) {
      console.error('Fetch public rooms error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回ロード時に公開ルーム一覧を取得
  React.useEffect(() => {
    fetchPublicRooms();
  }, []);

  const filteredRooms = availableRooms.filter(room => 
    !searchQuery || 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinRoomByCode = async () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    
    if (!roomCode.trim()) {
      alert('ルームコードを入力してください');
      return;
    }

    try {
      // サーバーにルーム参加リクエストを送信
      const response = await fetch('/api/rooms/join/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: roomCode,
          playerName,
          isSpectator
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ルーム参加に失敗しました');
      }

      const { room } = await response.json();
      console.log('Joined room:', room);

      navigate('/waiting-room', {
        state: {
          roomData: room,
          playerName,
          isSpectator,
          isHost: false
        }
      });
    } catch (error) {
      console.error('Join room error:', error);
      alert(error instanceof Error ? error.message : 'ルーム参加に失敗しました');
    }
  };

  const joinRoom = async (room: Room) => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    if (!isSpectator && room.players >= room.maxPlayers) {
      alert('このルームは満室です');
      return;
    }

    let password = '';
    if (room.isPrivate) {
      const inputPassword = prompt('パスワードを入力してください:');
      if (!inputPassword) return;
      password = inputPassword;
    }

    try {
      // サーバーにルーム参加リクエストを送信
      const response = await fetch(`/api/rooms/join/${room.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          password,
          isSpectator
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ルーム参加に失敗しました');
      }

      const { room: joinedRoom } = await response.json();
      console.log('Joined room:', joinedRoom);

      navigate('/waiting-room', {
        state: {
          roomData: joinedRoom,
          playerName,
          isSpectator,
          isHost: false
        }
      });
    } catch (error) {
      console.error('Join room error:', error);
      alert(error instanceof Error ? error.message : 'ルーム参加に失敗しました');
    }
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return '今';
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    return `${hours}時間前`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← メインメニューに戻る
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">ルーム参加</h1>
            <p className="text-gray-300">既存のルームに参加して他のプレイヤーと対戦</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* プレイヤー名入力 */}
            <div className="space-y-6">
              <div className="bg-black/20 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">プレイヤー情報</h3>
                <div>
                  <label className="block text-white font-semibold mb-2">
                    あなたの名前 *
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="プレイヤー名を入力"
                    className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    maxLength={20}
                  />
                </div>
                
                {/* 観戦者オプション */}
                <div className="mt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpectator}
                      onChange={(e) => setIsSpectator(e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-black/50 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <div>
                      <span className="text-white font-medium">観戦者として参加</span>
                      <div className="text-sm text-gray-300">
                        ゲームに参加せず、観戦のみを行います
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* ルームコード参加 */}
              <div className="bg-black/20 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-4">🔑 ルームコード参加</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      ルームコード
                    </label>
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none font-mono"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={joinRoomByCode}
                    disabled={!playerName.trim() || !roomCode.trim()}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      !playerName.trim() || !roomCode.trim()
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    参加
                  </button>
                </div>
              </div>
            </div>

            {/* 公開ルーム一覧 */}
            <div className="bg-black/20 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">🌐 公開ルーム一覧</h3>
                <button
                  onClick={fetchPublicRooms}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                  title="更新"
                >
                  {isLoading ? '⏳' : '🔄'}
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ルーム名やホスト名で検索..."
                  className="w-full p-2 bg-black/50 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-black/30 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white">{room.name}</h4>
                        {room.isPrivate && <span className="text-yellow-400">🔒</span>}
                      </div>
                      <span className="text-sm text-gray-400">{getTimeAgo(room.created)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-300">
                        <div>ホスト: {room.hostName}</div>
                        <div>モード: {room.gameMode}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          room.players >= room.maxPlayers ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {room.players}/{room.maxPlayers}
                        </div>
                        <div className="text-xs text-gray-400">プレイヤー</div>
                      </div>
                    </div>

                    <button
                      onClick={() => joinRoom(room)}
                      disabled={!playerName.trim() || (!isSpectator && room.players >= room.maxPlayers)}
                      className={`w-full py-2 rounded font-semibold transition-all ${
                        !playerName.trim() || (!isSpectator && room.players >= room.maxPlayers)
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : isSpectator
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {(!isSpectator && room.players >= room.maxPlayers) 
                        ? '満室' 
                        : isSpectator 
                        ? '観戦参加' 
                        : '参加'
                      }
                    </button>
                  </div>
                ))}

                {filteredRooms.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    {searchQuery ? '検索結果が見つかりません' : '現在参加可能なルームがありません'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;