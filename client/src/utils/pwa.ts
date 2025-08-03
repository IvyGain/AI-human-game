// PWA関連のユーティリティ

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // ServiceWorkerの登録
    await this.registerServiceWorker();
    
    // インストールプロンプトの監視
    this.setupInstallPrompt();
    
    // アプリインストール状態の監視
    this.checkInstallStatus();
  }

  // ServiceWorkerの登録
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        console.log('Service Worker registration started');
        
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.swRegistration);

        // 更新があった場合の処理
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新しいバージョンが利用可能
                this.notifyUpdateAvailable();
              }
            });
          }
        });

        // ServiceWorkerからのメッセージを監視
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event);
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.log('Service Worker is not supported');
    }
  }

  // インストールプロンプトの設定
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      console.log('beforeinstallprompt event triggered');
      
      // デフォルトの動作を防ぐ
      e.preventDefault();
      
      // プロンプトを保存
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      
      // インストールボタンを表示
      this.showInstallButton();
    });

    // アプリがインストールされた時
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstallSuccess();
    });
  }

  // インストール状態のチェック
  private checkInstallStatus(): void {
    // スタンドアロンモードで動作しているかチェック
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone) {
      this.isInstalled = true;
      console.log('App is running in standalone mode');
    }
  }

  // アプリのインストールを促す
  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('Install prompt is not available');
      return false;
    }

    try {
      // インストールプロンプトを表示
      await this.deferredPrompt.prompt();
      
      // ユーザーの選択を待つ
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      // プロンプトは一度しか使えないのでクリア
      this.deferredPrompt = null;
      
      if (outcome === 'accepted') {
        this.hideInstallButton();
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // インストールボタンを表示
  private showInstallButton(): void {
    // インストールボタンの作成・表示
    const existingButton = document.getElementById('pwa-install-button');
    if (existingButton) return;

    const button = document.createElement('button');
    button.id = 'pwa-install-button';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7,10 12,15 17,10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      アプリをインストール
    `;
    button.className = `
      fixed bottom-4 right-4 z-50
      bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg
      flex items-center gap-2 text-sm font-medium
      hover:bg-blue-700 transition-colors duration-200
      border-0 cursor-pointer
    `;
    
    button.addEventListener('click', () => {
      this.promptInstall();
    });

    document.body.appendChild(button);

    // 5秒後にフェードイン効果
    setTimeout(() => {
      button.style.opacity = '0';
      button.style.transform = 'translateY(100px)';
      button.style.transition = 'all 0.3s ease-out';
      
      requestAnimationFrame(() => {
        button.style.opacity = '1';
        button.style.transform = 'translateY(0)';
      });
    }, 100);
  }

  // インストールボタンを非表示
  private hideInstallButton(): void {
    const button = document.getElementById('pwa-install-button');
    if (button) {
      button.style.opacity = '0';
      button.style.transform = 'translateY(100px)';
      setTimeout(() => {
        button.remove();
      }, 300);
    }
  }

  // インストール成功メッセージ
  private showInstallSuccess(): void {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        <span>アプリがインストールされました！</span>
      </div>
    `;
    toast.className = `
      fixed top-4 right-4 z-50
      bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg
      text-sm font-medium opacity-0 transition-opacity duration-300
    `;

    document.body.appendChild(toast);

    // フェードイン
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);

    // 3秒後にフェードアウト
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // アップデート通知
  private notifyUpdateAvailable(): void {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <span>新しいバージョンが利用可能です</span>
        <button onclick="location.reload()" class="bg-white/20 px-3 py-1 rounded text-sm hover:bg-white/30">
          更新
        </button>
      </div>
    `;
    toast.className = `
      fixed top-4 left-4 z-50
      bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg
      text-sm font-medium opacity-0 transition-opacity duration-300
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
    }, 100);

    // 10秒後に自動で消す
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 10000);
  }

  // ServiceWorkerからのメッセージ処理
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'UPDATE_AVAILABLE':
        this.notifyUpdateAvailable();
        break;
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
      default:
        console.log('Unknown SW message:', type, payload);
    }
  }

  // ServiceWorkerにメッセージを送信
  public sendMessageToSW(type: string, payload?: any): void {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({ type, payload });
    }
  }

  // キャッシュをクリア
  public async clearCache(): Promise<boolean> {
    try {
      const channel = new MessageChannel();
      
      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };
        
        this.sendMessageToSW('CLEAR_CACHE');
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  // PWAの状態を取得
  public getStatus() {
    return {
      isInstalled: this.isInstalled,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      canInstall: !!this.deferredPrompt,
      hasServiceWorker: !!this.swRegistration,
      isOnline: navigator.onLine
    };
  }
}

// グローバルインスタンス
export const pwaManager = new PWAManager();

// 開発用のヘルパー
if (process.env.NODE_ENV === 'development') {
  (window as any).pwaManager = pwaManager;
}