import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { pwaManager } from '../utils/pwa';
import Button from './UI/Button';

const PWAInstallButton: React.FC = () => {
  const [showButton, setShowButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [pwaStatus, setPwaStatus] = useState(pwaManager.getStatus());

  useEffect(() => {
    // PWA状態を定期的にチェック
    const checkStatus = () => {
      const status = pwaManager.getStatus();
      setPwaStatus(status);
      
      // インストール可能で、まだインストールされていない場合にボタンを表示
      setShowButton(status.canInstall && !status.isInstalled && !status.isStandalone);
    };

    // 初回チェック
    checkStatus();

    // beforeinstallpromptイベントのリスナー
    const handleBeforeInstallPrompt = () => {
      setTimeout(checkStatus, 100); // 少し待ってからチェック
    };

    // appinstalledイベントのリスナー
    const handleAppInstalled = () => {
      setShowButton(false);
      setIsInstalling(false);
      checkStatus();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await pwaManager.promptInstall();
      
      if (success) {
        setShowButton(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // スタンドアロンモードまたはインストール済みの場合は表示しない
  if (pwaStatus.isStandalone || pwaStatus.isInstalled || !showButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Button
        variant="primary"
        size="lg"
        icon={isInstalling ? undefined : Download}
        onClick={handleInstall}
        disabled={isInstalling}
        loading={isInstalling}
        className="shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <div className="flex items-center gap-2">
          {!isInstalling && <Smartphone className="w-4 h-4" />}
          <span className="font-medium">
            {isInstalling ? 'インストール中...' : 'アプリをインストール'}
          </span>
        </div>
      </Button>
      
      {/* インストールのヒント */}
      <div className="absolute bottom-full right-0 mb-2 bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2">
          <Check className="w-3 h-3 text-green-400" />
          <span>オフラインでも使用可能</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Check className="w-3 h-3 text-green-400" />
          <span>ホーム画面に追加</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Check className="w-3 h-3 text-green-400" />
          <span>プッシュ通知対応</span>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton;