import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Gamepad2, 
  Trophy, 
  Users, 
  Search, 
  BarChart3, 
  Settings,
  Smartphone,
  Zap,
  Shield
} from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const MainMenuPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* モバイル最適化コンテナ */}
      <div className="safe-area-inset px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-md mx-auto sm:max-w-4xl">
          
          {/* ヘッダー - スマホ向けサイズ調整 */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4">
              Project JIN
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-2 px-4">
              最後に信じるのは、人間の直感か、AIの論理か。
            </p>
            <p className="text-sm sm:text-base text-gray-400">
              西暦2042年 - AI人狼ゲーム
            </p>
          </div>

          {/* メインメニュー - モバイルファーストグリッド */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            
            {/* ルール説明 */}
            <MenuCard
              icon={BookOpen}
              title="ルール説明"
              description="ゲームの遊び方とチュートリアル"
              onClick={() => navigate('/tutorial')}
              variant="info"
            />

            {/* クイックマッチ */}
            <MenuCard
              icon={Zap}
              title="クイックマッチ"
              description="すぐに他のプレイヤーと対戦"
              onClick={() => navigate('/quick-match')}
              variant="primary"
              featured={true}
            />

            {/* ランク戦 */}
            <MenuCard
              icon={Trophy}
              title="ランク戦"
              description="レーティング対戦でスキルを競う"
              onClick={() => navigate('/ranked')}
              variant="gold"
            />

            {/* プライベートルーム作成 */}
            <MenuCard
              icon={Users}
              title="ルーム作成"
              description="友達と一緒にプライベート対戦"
              onClick={() => navigate('/create-room')}
              variant="success"
            />

            {/* ルーム検索・参加 */}
            <MenuCard
              icon={Search}
              title="ルーム参加"
              description="既存のルームに参加する"
              onClick={() => navigate('/join-room')}
              variant="secondary"
            />

            {/* 戦績・リプレイ */}
            <MenuCard
              icon={BarChart3}
              title="戦績・リプレイ"
              description="過去の対戦記録を確認"
              onClick={() => navigate('/stats')}
              variant="purple"
            />
          </div>

          {/* フッター - スマホ向け大きなボタン */}
          <div className="mt-8 sm:mt-12 flex justify-center">
            <Button
              variant="ghost"
              icon={Settings}
              onClick={() => navigate('/settings')}
              className="text-gray-400 hover:text-white"
            >
              設定
            </Button>
          </div>

          {/* iOS向けセーフエリア */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>
    </div>
  );
};

interface MenuCardProps {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  title: string;
  description: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'info' | 'gold' | 'purple';
  featured?: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  variant, 
  featured = false 
}) => {
  const variantStyles = {
    primary: {
      base: 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50',
      hover: 'hover:from-blue-600/30 hover:to-purple-600/30 hover:border-blue-400',
      shadow: 'shadow-blue-500/25'
    },
    secondary: {
      base: 'bg-gray-600/20 border-gray-500/50',
      hover: 'hover:bg-gray-600/30 hover:border-gray-400',
      shadow: 'shadow-gray-500/25'
    },
    success: {
      base: 'bg-green-600/20 border-green-500/50',
      hover: 'hover:bg-green-600/30 hover:border-green-400',
      shadow: 'shadow-green-500/25'
    },
    info: {
      base: 'bg-cyan-600/20 border-cyan-500/50',
      hover: 'hover:bg-cyan-600/30 hover:border-cyan-400',
      shadow: 'shadow-cyan-500/25'
    },
    gold: {
      base: 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/50',
      hover: 'hover:from-yellow-600/30 hover:to-orange-600/30 hover:border-yellow-400',
      shadow: 'shadow-yellow-500/25'
    },
    purple: {
      base: 'bg-purple-600/20 border-purple-500/50',
      hover: 'hover:bg-purple-600/30 hover:border-purple-400',
      shadow: 'shadow-purple-500/25'
    }
  };

  const currentVariant = variantStyles[variant];
  const featuredClasses = featured ? 'ring-2 ring-blue-400/50 ring-offset-2 ring-offset-transparent' : '';

  return (
    <Card
      variant="glass"
      onClick={onClick}
      className={`
        border-2 transition-all duration-300 group cursor-pointer
        min-h-[140px] sm:min-h-[160px]
        active:scale-95 hover:scale-[1.02] sm:hover:scale-105
        ${currentVariant.base}
        ${currentVariant.hover}
        shadow-lg ${currentVariant.shadow}
        ${featuredClasses}
      `}
      padding="md"
    >
      <div className="flex flex-col h-full">
        {/* アイコン */}
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          {featured && (
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">人気</span>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed opacity-90">
            {description}
          </p>
        </div>

        {/* タッチフィードバック用インジケーター */}
        <div className="mt-3 flex justify-end">
          <div className="w-6 h-0.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors" />
        </div>
      </div>
    </Card>
  );
};

export default MainMenuPage;