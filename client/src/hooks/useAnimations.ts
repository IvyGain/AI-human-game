import { useEffect, useRef, useCallback } from 'react';
import { ANIMATIONS, PARTICLE_EFFECTS, SOUND_EFFECTS } from '../utils/animations';
import { GamePhase } from '@project-jin/shared';

interface ParticleConfig {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export function useAnimations() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ParticleConfig[]>([]);
  const animationFrameRef = useRef<number>();

  // パーティクルアニメーション
  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.5; // 重力
      particle.life--;

      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      return particle.life > 0;
    });

    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(updateParticles);
    }
  }, []);

  // パーティクル生成
  const createParticles = useCallback((
    type: keyof typeof PARTICLE_EFFECTS,
    centerX: number,
    centerY: number
  ) => {
    const config = PARTICLE_EFFECTS[type];
    const newParticles: ParticleConfig[] = [];

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + Math.random() * 0.5;
      const velocity = config.velocity.min + Math.random() * (config.velocity.max - config.velocity.min);
      
      newParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * velocity * 0.01,
        vy: Math.sin(angle) * velocity * 0.01,
        size: config.size.min + Math.random() * (config.size.max - config.size.min),
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        life: config.lifetime,
        maxLife: config.lifetime
      });
    }

    particlesRef.current.push(...newParticles);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    updateParticles();
  }, [updateParticles]);

  // 音響エフェクト再生
  const playSound = useCallback((soundPath: string, volume: number = 0.5) => {
    try {
      const audio = new Audio(soundPath);
      audio.volume = volume;
      audio.play().catch(console.error);
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, []);

  // フェーズ変更アニメーション
  const animatePhaseChange = useCallback((
    phase: GamePhase,
    element: HTMLElement | null
  ) => {
    if (!element) return;

    const animation = ANIMATIONS.phaseTransition[phase];
    if (!animation) return;

    // 既存のアニメーションクラスを削除
    element.classList.remove(...Object.values(ANIMATIONS.phaseTransition).map(a => a.className));
    
    // 新しいアニメーションクラスを追加
    element.classList.add(animation.className);
    element.style.background = `linear-gradient(135deg, ${animation.background})`;

    // 音響エフェクト再生
    const soundKey = phase === 'night' ? 'night' : 
                    phase.startsWith('day') ? 'day' : 'vote';
    if (SOUND_EFFECTS.phaseChange[soundKey as keyof typeof SOUND_EFFECTS.phaseChange]) {
      playSound(SOUND_EFFECTS.phaseChange[soundKey as keyof typeof SOUND_EFFECTS.phaseChange]);
    }

    // アニメーション完了後にクラスを削除
    setTimeout(() => {
      element.classList.remove(animation.className);
    }, animation.duration);
  }, [playSound]);

  // プレイヤー排除アニメーション
  const animatePlayerElimination = useCallback((
    element: HTMLElement | null,
    method: 'attack' | 'vote',
    centerX?: number,
    centerY?: number
  ) => {
    if (!element) return;

    const animation = ANIMATIONS.playerElimination[method];
    element.classList.add(animation.className);
    element.style.cssText += animation.effect;

    // パーティクルエフェクト
    if (centerX !== undefined && centerY !== undefined) {
      createParticles('elimination', centerX, centerY);
    }

    // 音響エフェクト
    playSound(SOUND_EFFECTS.actions.eliminate);

    // アニメーション完了後に状態を固定
    setTimeout(() => {
      element.classList.remove(animation.className);
      element.style.cssText += 'filter: brightness(0.3) saturate(0) grayscale(1);';
    }, animation.duration);
  }, [createParticles, playSound]);

  // 役職表示アニメーション
  const animateRoleReveal = useCallback((
    element: HTMLElement | null,
    centerX?: number,
    centerY?: number
  ) => {
    if (!element) return;

    element.classList.add(ANIMATIONS.roleReveal.className);

    // パーティクルエフェクト
    if (centerX !== undefined && centerY !== undefined) {
      createParticles('roleReveal', centerX, centerY);
    }

    setTimeout(() => {
      element.classList.remove(ANIMATIONS.roleReveal.className);
    }, ANIMATIONS.roleReveal.duration);
  }, [createParticles]);

  // アクションエフェクト
  const animateAction = useCallback((
    element: HTMLElement | null,
    actionType: keyof typeof ANIMATIONS.actionEffects
  ) => {
    if (!element) return;

    const animation = ANIMATIONS.actionEffects[actionType];
    element.classList.add(animation);

    // 音響エフェクト
    const soundKey = actionType as keyof typeof SOUND_EFFECTS.actions;
    if (SOUND_EFFECTS.actions[soundKey]) {
      playSound(SOUND_EFFECTS.actions[soundKey]);
    }

    setTimeout(() => {
      element.classList.remove(animation);
    }, 1000);
  }, [playSound]);

  // 通知アニメーション
  const animateNotification = useCallback((
    element: HTMLElement | null,
    type: keyof typeof ANIMATIONS.notification
  ) => {
    if (!element) return;

    const animation = ANIMATIONS.notification[type];
    element.className = `${element.className} ${animation}`.trim();

    // 音響エフェクト
    const soundType = type === 'error' ? 'error' : 'notification';
    playSound(SOUND_EFFECTS.ui[soundType]);

    setTimeout(() => {
      element.className = element.className.replace(animation, '').trim();
    }, 2000);
  }, [playSound]);

  // 勝利エフェクト
  const animateVictory = useCallback((centerX: number, centerY: number) => {
    createParticles('victory', centerX, centerY);
    
    // 勝利音（複数回再生）
    setTimeout(() => playSound(SOUND_EFFECTS.ui.notification), 0);
    setTimeout(() => playSound(SOUND_EFFECTS.ui.notification), 500);
    setTimeout(() => playSound(SOUND_EFFECTS.ui.notification), 1000);
  }, [createParticles, playSound]);

  // キャンバスリサイズ
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // 初期化とクリーンアップ
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [resizeCanvas]);

  return {
    canvasRef,
    animatePhaseChange,
    animatePlayerElimination,
    animateRoleReveal,
    animateAction,
    animateNotification,
    animateVictory,
    createParticles,
    playSound
  };
}

// UIコンポーネント用のアニメーションクラス生成
export function useButtonAnimations() {
  const getButtonClasses = useCallback((
    variant: 'primary' | 'secondary' | 'danger' = 'primary',
    size: 'sm' | 'md' | 'lg' = 'md',
    disabled: boolean = false
  ) => {
    const baseClasses = ANIMATIONS.button.hover + ' ' + ANIMATIONS.button.click;
    
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const disabledClasses = disabled 
      ? 'opacity-50 cursor-not-allowed transform-none' 
      : '';

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} rounded-lg font-medium transition-all duration-200`.trim();
  }, []);

  return { getButtonClasses };
}