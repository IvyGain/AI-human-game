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
  Play
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Badge from '../components/UI/Badge';

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
              <SettingSection title="基本設定">
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      ルーム名 *
                    </label>
                    <input
                      type="text"
                      value={settings.roomName}
                      onChange={(e) => handleSettingChange('roomName', e.target.value)}
                      placeholder="ルーム名を入力"
                      className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      maxLength={30}
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      最大参加人数: {settings.maxPlayers}人
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="15"
                      value={settings.maxPlayers}
                      onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>5人</span>
                      <span>15人</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="private"
                      checked={settings.isPrivate}
                      onChange={(e) => handleSettingChange('isPrivate', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <label htmlFor="private" className="text-white">
                      プライベートルーム（パスワード保護）
                    </label>
                  </div>

                  {settings.isPrivate && (
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        パスワード
                      </label>
                      <input
                        type="password"
                        value={settings.password}
                        onChange={(e) => handleSettingChange('password', e.target.value)}
                        placeholder="パスワードを入力"
                        className="w-full p-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </SettingSection>

              <SettingSection title="時間設定">
                <div className="space-y-4">
                  <TimeSlider
                    label="夜フェーズ"
                    value={settings.nightDuration}
                    onChange={(value) => handleSettingChange('nightDuration', value)}
                    min={60}
                    max={300}
                    unit="秒"
                  />
                  <TimeSlider
                    label="昼フェーズ（議論）"
                    value={settings.dayDuration}
                    onChange={(value) => handleSettingChange('dayDuration', value)}
                    min={120}
                    max={600}
                    unit="秒"
                  />
                  <TimeSlider
                    label="投票フェーズ"
                    value={settings.voteDuration}
                    onChange={(value) => handleSettingChange('voteDuration', value)}
                    min={30}
                    max={180}
                    unit="秒"
                  />
                </div>
              </SettingSection>
            </div>

            {/* 役職配分 */}
            <div className="space-y-6">
              <SettingSection title="役職配分">
                <div className="space-y-4">
                  <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/50">
                    <h4 className="font-bold text-red-300 mb-3">🤖 AI陣営</h4>
                    <RoleCounter
                      label="AI"
                      value={settings.roles.ai}
                      onChange={(value) => handleRoleChange('ai', value)}
                      description="夜に襲撃を行う"
                    />
                  </div>

                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50">
                    <h4 className="font-bold text-blue-300 mb-3">👥 人間陣営</h4>
                    <div className="space-y-3">
                      <RoleCounter
                        label="エンジニア"
                        value={settings.roles.engineer}
                        onChange={(value) => handleRoleChange('engineer', value)}
                        description="夜に調査を行う"
                      />
                      <RoleCounter
                        label="サイバーガード"
                        value={settings.roles.cyberGuard}
                        onChange={(value) => handleRoleChange('cyberGuard', value)}
                        description="夜に護衛を行う"
                      />
                      <RoleCounter
                        label="市民"
                        value={settings.roles.citizen}
                        onChange={(value) => handleRoleChange('citizen', value)}
                        description="特殊能力なし"
                      />
                    </div>
                  </div>

                  <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-500/50">
                    <h4 className="font-bold text-purple-300 mb-3">🎭 第三陣営</h4>
                    <RoleCounter
                      label="トリックスター"
                      value={settings.roles.trickster}
                      onChange={(value) => handleRoleChange('trickster', value)}
                      description="独自の勝利条件"
                    />
                  </div>

                  <div className="bg-yellow-900/30 p-3 rounded-lg border border-yellow-500/50">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-300 font-semibold">合計役職数:</span>
                      <span className={`font-bold ${
                        getTotalRoles() === settings.maxPlayers 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {getTotalRoles()} / {settings.maxPlayers}
                      </span>
                    </div>
                  </div>
                </div>
              </SettingSection>

              <button
                onClick={createRoom}
                disabled={!playerName.trim() || !settings.roomName.trim() || getTotalRoles() !== settings.maxPlayers}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                  !playerName.trim() || !settings.roomName.trim() || getTotalRoles() !== settings.maxPlayers
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 transform hover:scale-105'
                }`}
              >
                🚀 ルームを作成
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => (
  <div className="bg-black/20 p-6 rounded-lg">
    <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
    {children}
  </div>
);

interface TimeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ label, value, onChange, min, max, unit }) => (
  <div>
    <label className="block text-white font-semibold mb-2">
      {label}: {value}{unit}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={30}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full"
    />
    <div className="flex justify-between text-sm text-gray-400 mt-1">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

interface RoleCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description: string;
}

const RoleCounter: React.FC<RoleCounterProps> = ({ label, value, onChange, description }) => (
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="font-semibold text-white">{label}</div>
      <div className="text-sm text-gray-300">{description}</div>
    </div>
    <div className="flex items-center space-x-3">
      <button
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        className="w-8 h-8 bg-red-600 text-white rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
      >
        -
      </button>
      <span className="text-white font-bold w-8 text-center">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
      >
        +
      </button>
    </div>
  </div>
);

export default CreateRoomPage;