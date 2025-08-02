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

  // モックデータ - 実際の実装ではサーバーから取得
  const [availableRooms] = useState<Room[]>([
    {
      id: '1',
      name: '初心者歓迎ルーム',
      hostName: 'ホスト太郎',
      players: 4,
      maxPlayers: 8,
      isPrivate: false,
      gameMode: 'スタンダード',
      created: new Date(Date.now() - 300000) // 5分前
    },
    {
      id: '2',
      name: '上級者向け高速戦',
      hostName: 'ゲーマー花子',
      players: 6,
      maxPlayers: 10,
      isPrivate: false,
      gameMode: '高速',
      created: new Date(Date.now() - 600000) // 10分前
    },
    {
      id: '3',
      name: 'フレンド限定',
      hostName: 'プライベート主',
      players: 3,
      maxPlayers: 6,
      isPrivate: true,
      gameMode: 'カスタム',
      created: new Date(Date.now() - 120000) // 2分前
    }
  ]);

  const filteredRooms = availableRooms.filter(room => 
    !searchQuery || 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const joinRoomByCode = () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    
    if (!roomCode.trim()) {
      alert('ルームコードを入力してください');
      return;
    }

    // TODO: サーバーにルーム参加リクエストを送信
    console.log('Joining room with code:', roomCode);
    
    // モック用の設定
    const mockRoomSettings = {
      roomName: 'コード参加ルーム',
      maxPlayers: 8,
      password: '',
      isPrivate: true,
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
  };

  const joinRoom = (room: Room) => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }

    if (room.players >= room.maxPlayers) {
      alert('このルームは満室です');
      return;
    }

    if (room.isPrivate) {
      const password = prompt('パスワードを入力してください:');
      if (!password) return;
      // TODO: パスワード認証
    }

    // TODO: サーバーにルーム参加リクエストを送信
    console.log('Joining room:', room.id);

    // モック用の設定
    const mockRoomSettings = {
      roomName: room.name,
      maxPlayers: room.maxPlayers,
      password: '',
      isPrivate: room.isPrivate,
      nightDuration: 180,
      dayDuration: 300,
      voteDuration: 90,
      roles: {
        ai: 2,
        engineer: 1,
        cyberGuard: 1,
        citizen: room.maxPlayers - 5,
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
                  onClick={() => window.location.reload()}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="更新"
                >
                  🔄
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
                      disabled={!playerName.trim() || room.players >= room.maxPlayers}
                      className={`w-full py-2 rounded font-semibold transition-all ${
                        !playerName.trim() || room.players >= room.maxPlayers
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {room.players >= room.maxPlayers ? '満室' : '参加'}
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