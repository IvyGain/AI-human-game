import { useEffect, useRef } from 'react';
import { useAnimations } from '../hooks/useAnimations';

export interface GameNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'elimination' | 'victory';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface GameNotificationsProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
}

interface NotificationItemProps {
  notification: GameNotification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const { animateNotification, createParticles } = useAnimations();

  useEffect(() => {
    if (itemRef.current) {
      animateNotification(itemRef.current, notification.type as any);
    }

    // パーティクルエフェクト（特別な通知の場合）
    if (notification.type === 'victory' && itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      createParticles('victory', centerX, centerY);
    }

    // 自動消去タイマー
    if (!notification.persistent && notification.duration) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onDismiss, animateNotification, createParticles]);

  const getNotificationStyles = () => {
    const baseStyles = "relative p-4 rounded-lg shadow-lg backdrop-blur-sm border-l-4 transition-all duration-300";
    
    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-900/80 border-green-500 text-green-100`;
      case 'error':
        return `${baseStyles} bg-red-900/80 border-red-500 text-red-100`;
      case 'warning':
        return `${baseStyles} bg-yellow-900/80 border-yellow-500 text-yellow-100`;
      case 'info':
        return `${baseStyles} bg-blue-900/80 border-blue-500 text-blue-100`;
      case 'elimination':
        return `${baseStyles} bg-purple-900/80 border-purple-500 text-purple-100`;
      case 'victory':
        return `${baseStyles} bg-gradient-to-r from-yellow-900/80 to-orange-900/80 border-yellow-500 text-yellow-100`;
      default:
        return `${baseStyles} bg-gray-900/80 border-gray-500 text-gray-100`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'elimination': return '💀';
      case 'victory': return '🏆';
      default: return '🔔';
    }
  };

  return (
    <div
      ref={itemRef}
      className={getNotificationStyles()}
    >
      {/* 閉じるボタン */}
      {!notification.persistent && (
        <button
          onClick={() => onDismiss(notification.id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      )}

      {/* 通知内容 */}
      <div className="flex items-start space-x-3 pr-8">
        <span className="text-2xl flex-shrink-0">{getIcon()}</span>
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
      </div>

      {/* 勝利通知の特別エフェクト */}
      {notification.type === 'victory' && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse" />
      )}
    </div>
  );
}

export function GameNotifications({ notifications, onDismiss }: GameNotificationsProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// 結果表示用のモーダルコンポーネント
interface GameResultModalProps {
  isOpen: boolean;
  winner: string | null;
  players: any[];
  onRestart: () => void;
  onExit: () => void;
}

export function GameResultModal({
  isOpen,
  winner,
  players,
  onRestart,
  onExit
}: GameResultModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { animateVictory } = useAnimations();

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      animateVictory(centerX, centerY);
    }
  }, [isOpen, animateVictory]);

  if (!isOpen) return null;

  const getWinnerInfo = () => {
    switch (winner) {
      case 'human':
        return {
          title: '🏆 人間陣営の勝利！',
          description: 'すべてのAIと第三陣営を排除しました',
          color: 'from-blue-500 to-cyan-400'
        };
      case 'ai':
        return {
          title: '🤖 AI陣営の勝利！',
          description: '人間を支配下に置きました',
          color: 'from-purple-500 to-pink-500'
        };
      case 'third':
        return {
          title: '🃏 第三陣営の勝利！',
          description: '独自の勝利条件を達成しました',
          color: 'from-yellow-500 to-orange-500'
        };
      default:
        return {
          title: '🏁 ゲーム終了',
          description: 'ゲームが終了しました',
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  const winnerInfo = getWinnerInfo();
  const winningPlayers = players.filter(p => p.role?.faction === winner);
  const losingPlayers = players.filter(p => p.role?.faction !== winner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={`
          relative max-w-2xl w-full mx-4 p-8 rounded-2xl shadow-2xl
          bg-gradient-to-br ${winnerInfo.color} border border-white/20
        `}
      >
        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-4">
            {winnerInfo.title}
          </h1>
          <p className="text-xl text-white/90">
            {winnerInfo.description}
          </p>
        </div>

        {/* 勝利者リスト */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            🎉 勝利者
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {winningPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center"
              >
                <div className="text-2xl mb-2">
                  {player.isBot ? '🤖' : '👤'}
                </div>
                <div className="text-white font-bold">{player.name}</div>
                <div className="text-white/80 text-sm">{player.role?.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 敗北者リスト */}
        {losingPlayers.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white/80 mb-3 text-center">
              参加者
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {losingPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-black/20 rounded-lg p-3 text-center"
                >
                  <div className="text-lg mb-1">
                    {player.isBot ? '🤖' : '👤'}
                  </div>
                  <div className="text-white/70 text-sm">{player.name}</div>
                  <div className="text-white/50 text-xs">{player.role?.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            🔄 もう一度プレイ
          </button>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-black/30 hover:bg-black/40 text-white font-semibold rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            🚪 ロビーに戻る
          </button>
        </div>
      </div>
    </div>
  );
}