import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Lock, 
  Unlock, 
  Clock, 
  Settings as SettingsIcon,
  Plus,
  Minus,
  Play,
  Shield,
  Timer,
  Gamepad2
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Badge from '../components/UI/Badge';
import NumberInput from '../components/UI/NumberInput';

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

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<RoomSettings>({
    roomName: '',
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
  });

  const [playerName, setPlayerName] = useState('');

  const handleSettingChange = <K extends keyof RoomSettings>(
    key: K,
    value: RoomSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleRoleChange = (role: keyof RoomSettings['roles'], value: number) => {
    setSettings(prev => ({
      ...prev,
      roles: { ...prev.roles, [role]: Math.max(0, value) }
    }));
  };

  const getTotalRoles = () => {
    return Object.values(settings.roles).reduce((sum, count) => sum + count, 0);
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      alert('プレイヤー名を入力してください');
      return;
    }
    
    if (!settings.roomName.trim()) {
      alert('ルーム名を入力してください');
      return;
    }

    if (getTotalRoles() !== settings.maxPlayers) {
      alert(`役職の合計数（${getTotalRoles()}）が参加人数（${settings.maxPlayers}）と一致しません`);
      return;
    }

    try {
      // サーバーにルーム作成リクエストを送信
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings,
          playerName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ルーム作成に失敗しました');
      }

      const { room } = await response.json();
      console.log('Room created:', room);
      
      // 待機ルームに移動
      navigate('/waiting-room', { 
        state: { 
          roomData: room,
          playerName,
          isHost: true 
        } 
      });
    } catch (error) {
      console.error('Room creation error:', error);
      alert(error instanceof Error ? error.message : 'ルーム作成に失敗しました');
    }
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
              <h1 className="text-2xl sm:text-3xl font-bold text-white">ルーム作成</h1>
              <p className="text-gray-300">友達と一緒に楽しむための専用ルームを作成</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 基本設定 */}
            <div className="space-y-6">
              <Card variant="glass" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-600/20 rounded-xl">
                    <SettingsIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">基本設定</h3>
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

                  <Input
                    label="ルーム名 *"
                    value={settings.roomName}
                    onChange={(e) => handleSettingChange('roomName', e.target.value)}
                    placeholder="ルーム名を入力"
                    variant="filled"
                    maxLength={30}
                  />

                  <NumberInput
                    label={`最大参加人数: ${settings.maxPlayers}人`}
                    value={settings.maxPlayers}
                    onChange={(value) => handleSettingChange('maxPlayers', value)}
                    min={5}
                    max={15}
                    step={1}
                  />

                  <div className="mt-6">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.isPrivate}
                        onChange={(e) => handleSettingChange('isPrivate', e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {settings.isPrivate ? (
                            <Lock className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-white font-medium">プライベートルーム</span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          パスワード保護でプライベートな対戦
                        </p>
                      </div>
                    </label>
                  </div>

                  {settings.isPrivate && (
                    <Input
                      label="パスワード"
                      type="password"
                      value={settings.password}
                      onChange={(e) => handleSettingChange('password', e.target.value)}
                      placeholder="パスワードを入力"
                      variant="filled"
                      icon={Lock}
                      iconPosition="left"
                    />
                  )}
                </div>
              </Card>

              <Card variant="glass" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-600/20 rounded-xl">
                    <Timer className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">時間設定</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      夜フェーズ: {settings.nightDuration}秒
                    </label>
                    <input
                      type="range"
                      min={60}
                      max={300}
                      step={30}
                      value={settings.nightDuration}
                      onChange={(e) => handleSettingChange('nightDuration', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>60秒</span>
                      <span>300秒</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      昼フェーズ（議論）: {settings.dayDuration}秒
                    </label>
                    <input
                      type="range"
                      min={120}
                      max={600}
                      step={30}
                      value={settings.dayDuration}
                      onChange={(e) => handleSettingChange('dayDuration', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>120秒</span>
                      <span>600秒</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      投票フェーズ: {settings.voteDuration}秒
                    </label>
                    <input
                      type="range"
                      min={30}
                      max={180}
                      step={30}
                      value={settings.voteDuration}
                      onChange={(e) => handleSettingChange('voteDuration', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>30秒</span>
                      <span>180秒</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* 役職配分 */}
            <div className="space-y-6">
              <Card variant="glass" padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-600/20 rounded-xl">
                    <Users className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">役職配分</h3>
                </div>
                
                <div className="space-y-4">
                  <Card variant="outlined" padding="md" className="border-red-500/50 bg-red-900/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-600/20 rounded-lg">
                        <Gamepad2 className="w-4 h-4 text-red-400" />
                      </div>
                      <h4 className="font-bold text-red-300">AI陣営</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">AI</div>
                        <div className="text-sm text-gray-300">夜に襲撃を行う</div>
                      </div>
                      <NumberInput
                        value={settings.roles.ai}
                        onChange={(value) => handleRoleChange('ai', value)}
                        min={0}
                        max={10}
                        size="sm"
                        className="w-32"
                      />
                    </div>
                  </Card>

                  <Card variant="outlined" padding="md" className="border-blue-500/50 bg-blue-900/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <h4 className="font-bold text-blue-300">人間陣営</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">エンジニア</div>
                          <div className="text-sm text-gray-300">夜に調査を行う</div>
                        </div>
                        <NumberInput
                          value={settings.roles.engineer}
                          onChange={(value) => handleRoleChange('engineer', value)}
                          min={0}
                          max={5}
                          size="sm"
                          className="w-32"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">サイバーガード</div>
                          <div className="text-sm text-gray-300">夜に護衛を行う</div>
                        </div>
                        <NumberInput
                          value={settings.roles.cyberGuard}
                          onChange={(value) => handleRoleChange('cyberGuard', value)}
                          min={0}
                          max={5}
                          size="sm"
                          className="w-32"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-white">市民</div>
                          <div className="text-sm text-gray-300">特殊能力なし</div>
                        </div>
                        <NumberInput
                          value={settings.roles.citizen}
                          onChange={(value) => handleRoleChange('citizen', value)}
                          min={0}
                          max={10}
                          size="sm"
                          className="w-32"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card variant="outlined" padding="md" className="border-purple-500/50 bg-purple-900/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Shield className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="font-bold text-purple-300">第三陣営</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">トリックスター</div>
                        <div className="text-sm text-gray-300">独自の勝利条件</div>
                      </div>
                      <NumberInput
                        value={settings.roles.trickster}
                        onChange={(value) => handleRoleChange('trickster', value)}
                        min={0}
                        max={3}
                        size="sm"
                        className="w-32"
                      />
                    </div>
                  </Card>

                  <Card 
                    variant="outlined" 
                    padding="md" 
                    className={`border-2 ${
                      getTotalRoles() === settings.maxPlayers 
                        ? 'border-green-500/50 bg-green-900/20' 
                        : 'border-yellow-500/50 bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">合計役職数:</span>
                      <Badge 
                        variant={getTotalRoles() === settings.maxPlayers ? "success" : "warning"}
                        size="lg"
                      >
                        {getTotalRoles()} / {settings.maxPlayers}
                      </Badge>
                    </div>
                  </Card>
                </div>
              </Card>

              <Button
                variant="success"
                size="lg"
                fullWidth
                icon={Play}
                onClick={createRoom}
                disabled={!playerName.trim() || !settings.roomName.trim() || getTotalRoles() !== settings.maxPlayers}
                className="py-4 text-lg font-bold"
              >
                ルームを作成
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CreateRoomPage;