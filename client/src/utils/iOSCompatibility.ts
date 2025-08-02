// iOS Safari特有の問題を解決するためのユーティリティ

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isIOSSafari = (): boolean => {
  return isIOS() && isSafari();
};

// iOS Safari用のスクロール固定
export const preventIOSBounce = (): void => {
  if (!isIOSSafari()) return;
  
  document.body.style.position = 'fixed';
  document.body.style.top = '0';
  document.body.style.left = '0';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.style.overflow = 'hidden';
};

// iOS Safari用のスクロール復元
export const restoreIOSScroll = (): void => {
  if (!isIOSSafari()) return;
  
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.style.overflow = '';
};

// iOS Safari用のフォーカス処理
export const handleIOSFocus = (element: HTMLElement): void => {
  if (!isIOSSafari()) return;
  
  // iOSでのキーボード表示時のスクロール問題を回避
  setTimeout(() => {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });
  }, 300);
};

// iOS Safari用のタッチイベント処理
export const addIOSTouchSupport = (element: HTMLElement): void => {
  if (!isIOSSafari()) return;
  
  // タッチイベントのパッシブリスナーを追加
  element.addEventListener('touchstart', () => {}, { passive: true });
  element.addEventListener('touchmove', () => {}, { passive: true });
  element.addEventListener('touchend', () => {}, { passive: true });
};

// iOS Safari用のクリック遅延対策
export const optimizeIOSClicks = (): void => {
  if (!isIOSSafari()) return;
  
  // FastClickライブラリの代替実装
  const style = document.createElement('style');
  style.textContent = `
    * {
      touch-action: manipulation;
    }
    
    button, [role="button"], input[type="button"], input[type="submit"] {
      cursor: pointer;
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
    }
    
    input, textarea, select {
      -webkit-appearance: none;
      border-radius: 0;
    }
  `;
  document.head.appendChild(style);
};

// iOS Safari用のビューポート管理
export const setupIOSViewport = (): void => {
  if (!isIOSSafari()) return;
  
  // ビューポートの動的調整
  const updateViewportHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  updateViewportHeight();
  window.addEventListener('resize', updateViewportHeight);
  window.addEventListener('orientationchange', () => {
    setTimeout(updateViewportHeight, 100);
  });
};

// iOS Safari用のキーボード対応
export const handleIOSKeyboard = (): void => {
  if (!isIOSSafari()) return;
  
  let initialViewportHeight = window.innerHeight;
  
  const handleResize = () => {
    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    
    // キーボードが表示されている場合
    if (heightDifference > 150) {
      document.body.classList.add('keyboard-visible');
    } else {
      document.body.classList.remove('keyboard-visible');
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  // フォーカス時の処理
  document.addEventListener('focusin', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      setTimeout(() => {
        e.target.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  });
};

// iOS Safari用のPWA対応
export const setupIOSPWA = (): void => {
  if (!isIOSSafari()) return;
  
  // スタンドアロンモードの検出
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone;
  
  if (isStandalone) {
    document.body.classList.add('standalone');
    
    // ステータスバーの高さを考慮
    const style = document.createElement('style');
    style.textContent = `
      .standalone {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
    `;
    document.head.appendChild(style);
  }
};

// 全ての iOS 対応を初期化
export const initializeIOSCompatibility = (): void => {
  if (!isIOSSafari()) return;
  
  optimizeIOSClicks();
  setupIOSViewport();
  handleIOSKeyboard();
  setupIOSPWA();
  
  console.log('iOS compatibility features initialized');
};