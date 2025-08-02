import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';

const ConnectionMonitor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      const handleConnect = () => {
        setIsConnected(true);
        setShowRetry(false);
        setRetryCount(0);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
        setShowRetry(true);
      };
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      setIsConnected(socket.connected);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
    
    // WebSocket接続失敗のカスタムイベントリスナー
    const handleConnectionFailed = () => {
      setShowRetry(true);
      setIsConnected(false);
    };
    
    window.addEventListener('websocket-connection-failed', handleConnectionFailed);
    
    return () => {
      window.removeEventListener('websocket-connection-failed', handleConnectionFailed);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setShowRetry(false);
    
    try {
      socketService.forceReconnect();
      
      // 5秒後に接続できていなければ再度リトライボタンを表示
      setTimeout(() => {
        if (!socketService.isConnected()) {
          setShowRetry(true);
        }
      }, 5000);
    } catch (error) {
      console.error('Retry connection failed:', error);
      setShowRetry(true);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // 接続中は何も表示しない
  if (isConnected) {
    return null;
  }

  // 接続失敗時のオーバーレイ
  if (showRetry) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 max-w-sm w-full text-center border border-red-500/30">
          <div className="text-4xl mb-4">📡</div>
          <h2 className="text-xl font-bold text-white mb-2">接続エラー</h2>
          <p className="text-gray-300 mb-4 text-sm">
            サーバーとの接続が切断されました。<br />
            ネットワーク接続を確認してください。
          </p>
          
          {retryCount > 0 && (
            <p className="text-yellow-400 text-xs mb-4">
              再試行回数: {retryCount}
            </p>
          )}
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors active:scale-95"
            >
              再接続
            </button>
            <button
              onClick={handleGoHome}
              className="w-full py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors active:scale-95"
            >
              ホームに戻る
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            Wi-Fi環境でのご利用を推奨します
          </div>
        </div>
      </div>
    );
  }

  // 接続中のインジケーター
  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-yellow-600/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
        <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-medium">接続中...</span>
      </div>
    </div>
  );
};

export default ConnectionMonitor;