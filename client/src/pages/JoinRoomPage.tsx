import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Users, 
  Clock, 
  Lock,
  Eye,
  Play,
  Hash,
  Gamepad2
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Badge from '../components/UI/Badge';

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
        // 日付文字列をDateオブジェクトに変換
        const roomsWithDates = rooms.map((room: any) => ({
          ...room,
          created: new Date(room.created)
        }));
        setAvailableRooms(roomsWithDates);
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

  const getTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 無効な日付をチェック
    if (isNaN(dateObj.getTime())) {
      return '不明';
    }
    
    const minutes = Math.floor((Date.now() - dateObj.getTime()) / 60000);
    if (minutes < 1) return '今';
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    return `${days}日前`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* モバイル最適化コンテナ */}
      <div className="safe-area-inset px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-2xl mx-auto sm:max-w-4xl">
          
          {/* ヘッダー */}
          <div className="flex items-center gap-4 mb-6 sm:mb-8">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white p-2"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">ルーム参加</h1>
              <p className="text-gray-300 text-sm sm:text-base">既存のルームに参加して他のプレイヤーと対戦</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* プレイヤー名入力 */}
            <div className="space-y-6">
              <Card variant="glass" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-600/20 rounded-xl">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">プレイヤー情報</h3>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="あなたの名前 *"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="プレイヤー名を入力"
                    variant="filled"
                    maxLength={20}
                  />
                  
                  {/* 観戦者オプション */}
                  <div className="mt-6">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={isSpectator}
                        onChange={(e) => setIsSpectator(e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-purple-400" />
                          <span className="text-white font-medium">観戦者として参加</span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          ゲームに参加せず、観戦のみを行います
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </Card>

              {/* ルームコード参加 */}
              <Card variant="glass" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-600/20 rounded-xl">
                    <Hash className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">ルームコード参加</h3>
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="ルームコード"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    variant="filled"
                    maxLength={6}
                    className="font-mono text-center tracking-wider"
                  />
                  
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={Play}
                    onClick={joinRoomByCode}
                    disabled={!playerName.trim() || !roomCode.trim()}
                  >
                    参加
                  </Button>
                </div>
              </Card>
            </div>

            {/* 公開ルーム一覧 */}
            <Card variant="glass" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-600/20 rounded-xl">
                    <Search className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">公開ルーム一覧</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={RefreshCw}
                  onClick={fetchPublicRooms}
                  disabled={isLoading}
                  loading={isLoading}
                  className="text-cyan-400 hover:text-cyan-300"
                />
              </div>

              <div className="mb-6">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ルーム名やホスト名で検索..."
                  variant="filled"
                  icon={Search}
                  iconPosition="left"
                />
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.id}
                    variant="elevated"
                    padding="md"
                    className="hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                          <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                              {room.name}
                            </h4>
                            {room.isPrivate && (
                              <Badge variant="warning" size="sm">
                                <Lock className="w-3 h-3" />
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(room.created)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={room.players >= room.maxPlayers ? "error" : "success"}
                        size="sm"
                      >
                        {room.players}/{room.maxPlayers}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-300 space-y-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>ホスト: {room.hostName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-3 h-3 text-gray-400" />
                          <span>モード: {room.gameMode}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={isSpectator ? "secondary" : "primary"}
                      size="md"
                      fullWidth
                      icon={isSpectator ? Eye : Play}
                      onClick={() => joinRoom(room)}
                      disabled={!playerName.trim() || (!isSpectator && room.players >= room.maxPlayers)}
                    >
                      {(!isSpectator && room.players >= room.maxPlayers) 
                        ? '満室' 
                        : isSpectator 
                        ? '観戦参加' 
                        : '参加'
                      }
                    </Button>
                  </Card>
                ))}

                {filteredRooms.length === 0 && (
                  <Card variant="outline" padding="lg" className="text-center">
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="p-3 bg-gray-600/20 rounded-full">
                        <Search className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-400">
                        {searchQuery ? '検索結果が見つかりません' : '現在参加可能なルームがありません'}
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;