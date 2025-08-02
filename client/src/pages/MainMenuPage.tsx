import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainMenuPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 max-w-4xl w-full mx-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Project JIN
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            最後に信じるのは、人間の直感か、AIの論理か。
          </p>
          <p className="text-gray-400">
            西暦2042年 - AI人狼ゲーム
          </p>
        </div>

        {/* メインメニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ルール説明 */}
          <MenuCard
            icon="📖"
            title="ルール説明"
            description="ゲームの遊び方とチュートリアル"
            onClick={() => navigate('/tutorial')}
            variant="info"
          />

          {/* クイックマッチ */}
          <MenuCard
            icon="🎮"
            title="クイックマッチ"
            description="すぐに他のプレイヤーと対戦"
            onClick={() => navigate('/quick-match')}
            variant="primary"
          />

          {/* ランク戦 */}
          <MenuCard
            icon="🏆"
            title="ランク戦"
            description="レーティング対戦でスキルを競う"
            onClick={() => navigate('/ranked')}
            variant="gold"
          />

          {/* プライベートルーム作成 */}
          <MenuCard
            icon="👥"
            title="ルーム作成"
            description="友達と一緒にプライベート対戦"
            onClick={() => navigate('/create-room')}
            variant="success"
          />

          {/* ルーム検索・参加 */}
          <MenuCard
            icon="🔍"
            title="ルーム参加"
            description="既存のルームに参加する"
            onClick={() => navigate('/join-room')}
            variant="secondary"
          />

          {/* 戦績・リプレイ */}
          <MenuCard
            icon="📊"
            title="戦績・リプレイ"
            description="過去の対戦記録を確認"
            onClick={() => navigate('/stats')}
            variant="purple"
          />
        </div>

        {/* フッター */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ⚙️ 設定
          </button>
        </div>
      </div>
    </div>
  );
};

interface MenuCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'success' | 'info' | 'gold' | 'purple';
}

const MenuCard: React.FC<MenuCardProps> = ({ icon, title, description, onClick, variant }) => {
  const variantStyles = {
    primary: 'bg-blue-600/20 border-blue-500/50 hover:bg-blue-600/30 hover:border-blue-400',
    secondary: 'bg-gray-600/20 border-gray-500/50 hover:bg-gray-600/30 hover:border-gray-400',
    success: 'bg-green-600/20 border-green-500/50 hover:bg-green-600/30 hover:border-green-400',
    info: 'bg-cyan-600/20 border-cyan-500/50 hover:bg-cyan-600/30 hover:border-cyan-400',
    gold: 'bg-yellow-600/20 border-yellow-500/50 hover:bg-yellow-600/30 hover:border-yellow-400',
    purple: 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30 hover:border-purple-400',
  };

  return (
    <button
      onClick={onClick}
      className={`
        p-6 rounded-xl border-2 transition-all duration-300 text-left group
        transform hover:scale-105 hover:shadow-2xl
        ${variantStyles[variant]}
      `}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
        {title}
      </h3>
      <p className="text-gray-300 text-sm leading-relaxed">
        {description}
      </p>
    </button>
  );
};

export default MainMenuPage;