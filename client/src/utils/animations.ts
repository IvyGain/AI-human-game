/**
 * CLAUDE.mdの設計に基づくアニメーション定義
 * Project JINのテーマに合わせたサイバーパンク風エフェクト
 */

export const ANIMATIONS = {
  // フェーズ変更アニメーション
  phaseTransition: {
    night: {
      className: "animate-fade-to-dark",
      background: "from-gray-900 to-indigo-900",
      duration: 2000
    },
    day_report: {
      className: "animate-dawn-break",
      background: "from-orange-800 to-yellow-600",
      duration: 1500
    },
    day_discussion: {
      className: "animate-fade-to-light",
      background: "from-blue-500 to-cyan-400",
      duration: 1000
    },
    day_vote: {
      className: "animate-pulse-red",
      background: "from-red-600 to-pink-500",
      duration: 1000
    },
    execution: {
      className: "animate-lightning",
      background: "from-purple-800 to-red-800",
      duration: 3000
    }
  },

  // プレイヤー状態変更
  playerElimination: {
    attack: {
      className: "animate-glitch-death",
      effect: "filter: brightness(0.3) saturate(0) hue-rotate(0deg)",
      duration: 2000
    },
    vote: {
      className: "animate-fade-out",
      effect: "filter: brightness(0.5) grayscale(1)",
      duration: 1500
    }
  },

  // 役職表示
  roleReveal: {
    className: "animate-matrix-reveal",
    duration: 3000
  },

  // チャットメッセージ
  messageEntry: {
    human: "animate-slide-in-left",
    ai: "animate-slide-in-right",
    system: "animate-fade-in-center"
  },

  // 投票・行動エフェクト
  actionEffects: {
    investigate: "animate-scan-pulse",
    protect: "animate-shield-glow",
    attack: "animate-red-flash",
    vote: "animate-target-lock"
  },

  // UI要素
  button: {
    hover: "transition-all duration-200 hover:scale-105 hover:shadow-lg",
    click: "transform active:scale-95",
    loading: "animate-pulse"
  },

  // 通知・警告
  notification: {
    success: "animate-bounce-in text-green-400",
    error: "animate-shake text-red-400",
    warning: "animate-pulse text-yellow-400",
    info: "animate-fade-in text-blue-400"
  }
};

// カスタムCSS キーフレーム
export const CUSTOM_KEYFRAMES = `
@keyframes fade-to-dark {
  0% { 
    filter: brightness(1) hue-rotate(0deg);
    background: linear-gradient(135deg, #1f2937, #374151);
  }
  50% { 
    filter: brightness(0.7) hue-rotate(240deg);
    background: linear-gradient(135deg, #1e1b4b, #312e81);
  }
  100% { 
    filter: brightness(0.4) hue-rotate(240deg);
    background: linear-gradient(135deg, #0f0f23, #1e1b4b);
  }
}

@keyframes dawn-break {
  0% { 
    filter: brightness(0.4) hue-rotate(240deg);
    background: linear-gradient(135deg, #0f0f23, #1e1b4b);
  }
  50% { 
    filter: brightness(0.8) hue-rotate(30deg);
    background: linear-gradient(135deg, #7c2d12, #ea580c);
  }
  100% { 
    filter: brightness(1) hue-rotate(60deg);
    background: linear-gradient(135deg, #ca8a04, #eab308);
  }
}

@keyframes fade-to-light {
  0% { 
    filter: brightness(1) hue-rotate(60deg);
  }
  100% { 
    filter: brightness(1.1) hue-rotate(180deg);
    background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  }
}

@keyframes pulse-red {
  0%, 100% { 
    filter: brightness(1) saturate(1);
    background: linear-gradient(135deg, #dc2626, #ec4899);
  }
  50% { 
    filter: brightness(1.3) saturate(1.5);
    background: linear-gradient(135deg, #b91c1c, #be185d);
  }
}

@keyframes lightning {
  0%, 20%, 40%, 60%, 80%, 100% { 
    filter: brightness(1);
  }
  10%, 30%, 50%, 70%, 90% { 
    filter: brightness(2) contrast(1.5);
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.8);
  }
}

@keyframes glitch-death {
  0% { transform: translateX(0); filter: brightness(1); }
  10% { transform: translateX(-2px) skew(0.5deg); filter: brightness(1.5) hue-rotate(90deg); }
  20% { transform: translateX(2px) skew(-0.5deg); filter: brightness(0.8) hue-rotate(180deg); }
  30% { transform: translateX(-1px) skew(0.3deg); filter: brightness(1.2) hue-rotate(270deg); }
  40% { transform: translateX(1px) skew(-0.3deg); filter: brightness(0.5) hue-rotate(0deg); }
  50% { transform: translateX(0) skew(0deg); filter: brightness(0.3) grayscale(1); }
  100% { transform: translateX(0) skew(0deg); filter: brightness(0.2) grayscale(1); }
}

@keyframes matrix-reveal {
  0% { 
    opacity: 0;
    transform: perspective(1000px) rotateY(90deg) scale(0.8);
    filter: brightness(0) contrast(0);
  }
  20% {
    opacity: 0.3;
    transform: perspective(1000px) rotateY(45deg) scale(0.9);
    filter: brightness(2) contrast(2) hue-rotate(120deg);
  }
  50% {
    opacity: 0.7;
    transform: perspective(1000px) rotateY(0deg) scale(1.05);
    filter: brightness(1.5) contrast(1.5) hue-rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: perspective(1000px) rotateY(0deg) scale(1);
    filter: brightness(1) contrast(1) hue-rotate(0deg);
  }
}

@keyframes slide-in-left {
  0% { 
    transform: translateX(-100%) scale(0.8);
    opacity: 0;
  }
  100% { 
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes slide-in-right {
  0% { 
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  100% { 
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes fade-in-center {
  0% { 
    transform: scale(0.5);
    opacity: 0;
  }
  100% { 
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes scan-pulse {
  0%, 100% { 
    box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% { 
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
  }
}

@keyframes shield-glow {
  0%, 100% { 
    box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% { 
    box-shadow: 0 0 25px rgba(34, 197, 94, 0.8);
  }
}

@keyframes red-flash {
  0%, 100% { 
    background-color: transparent;
  }
  50% { 
    background-color: rgba(239, 68, 68, 0.3);
  }
}

@keyframes target-lock {
  0% { 
    border-color: transparent;
    transform: scale(1);
  }
  25% { 
    border-color: #ef4444;
    transform: scale(1.05);
  }
  50% { 
    border-color: #dc2626;
    transform: scale(1.1);
  }
  75% { 
    border-color: #b91c1c;
    transform: scale(1.05);
  }
  100% { 
    border-color: #7f1d1d;
    transform: scale(1);
  }
}

@keyframes bounce-in {
  0% { 
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  50% { 
    transform: scale(1.3) rotate(90deg);
    opacity: 0.8;
  }
  100% { 
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
`;

// パーティクルエフェクト用の設定
export const PARTICLE_EFFECTS = {
  elimination: {
    count: 50,
    colors: ['#ef4444', '#dc2626', '#b91c1c'],
    size: { min: 2, max: 6 },
    velocity: { min: 50, max: 200 },
    lifetime: 2000
  },
  roleReveal: {
    count: 30,
    colors: ['#3b82f6', '#1d4ed8', '#1e40af'],
    size: { min: 1, max: 4 },
    velocity: { min: 30, max: 150 },
    lifetime: 3000
  },
  victory: {
    count: 100,
    colors: ['#22c55e', '#16a34a', '#15803d', '#fbbf24', '#f59e0b'],
    size: { min: 3, max: 8 },
    velocity: { min: 100, max: 300 },
    lifetime: 5000
  }
};

// 音響エフェクト設定
export const SOUND_EFFECTS = {
  phaseChange: {
    night: '/sounds/night-transition.mp3',
    day: '/sounds/day-transition.mp3',
    vote: '/sounds/vote-phase.mp3'
  },
  actions: {
    investigate: '/sounds/scan.mp3',
    protect: '/sounds/shield.mp3',
    attack: '/sounds/attack.mp3',
    eliminate: '/sounds/elimination.mp3'
  },
  ui: {
    click: '/sounds/click.mp3',
    hover: '/sounds/hover.mp3',
    notification: '/sounds/notification.mp3',
    error: '/sounds/error.mp3'
  }
};