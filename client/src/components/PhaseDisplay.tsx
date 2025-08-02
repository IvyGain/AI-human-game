import React, { useEffect, useRef, useState } from 'react';
import { GameState, GamePhase } from '@project-jin/shared';
import { useAnimations } from '../hooks/useAnimations';

interface PhaseDisplayProps {
  gameState: GameState;
}

interface PhaseConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  duration?: number;
}

export function PhaseDisplay({ gameState }: PhaseDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>(gameState.phase);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { animatePhaseChange } = useAnimations();

  const phaseConfigs: Record<GamePhase, PhaseConfig> = {
    night: {
      name: '夜',
      description: '各プレイヤーが能力を行使する時間です',
      icon: '🌙',
      color: 'from-indigo-900 to-purple-900',
      duration: 180
    },
    day_report: {
      name: '朝 - 結果報告',
      description: '夜の出来事が明らかになります',
      icon: '🌅',
      color: 'from-orange-700 to-yellow-600',
      duration: 60
    },
    day_discussion: {
      name: '昼 - 議論',
      description: '疑わしいプレイヤーについて話し合います',
      icon: '💬',
      color: 'from-blue-500 to-cyan-400',
      duration: 300
    },
    day_vote: {
      name: '昼 - 投票',
      description: '追放するプレイヤーに投票します',
      icon: '🗳️',
      color: 'from-red-600 to-pink-500',
      duration: 90
    },
    execution: {
      name: '処刑',
      description: '投票結果に基づき処刑が行われます',
      icon: '⚡',
      color: 'from-purple-800 to-red-800'
    }
  };

  // フェーズ変更時のアニメーション
  useEffect(() => {
    if (currentPhase !== gameState.phase) {
      setCurrentPhase(gameState.phase);
      animatePhaseChange(gameState.phase, containerRef.current);
    }
  }, [gameState.phase, currentPhase, animatePhaseChange]);

  // タイマー管理
  useEffect(() => {
    const config = phaseConfigs[gameState.phase];
    if (!config.duration) return;

    setTimeRemaining(config.duration);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.phase, gameState.turn]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    const config = phaseConfigs[gameState.phase];
    if (!config.duration || timeRemaining === null) return 0;
    return ((config.duration - timeRemaining) / config.duration) * 100;
  };

  const config = phaseConfigs[gameState.phase];
  const alivePlayers = gameState.players.filter(p => p.status === 'alive');
  const humanPlayers = alivePlayers.filter(p => !p.isBot);
  const aiPlayers = alivePlayers.filter(p => p.isBot);

  return (
    <div 
      ref={containerRef}
      className={`bg-gradient-to-br ${config.color} p-6 rounded-xl shadow-2xl border border-gray-700 transition-all duration-1000`}
    >
      {/* フェーズヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-4xl animate-pulse">{config.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              {config.name}フェーズ
            </h2>
            <p className="text-white/80 text-sm font-medium">
              ターン {gameState.turn}
            </p>
          </div>
        </div>
        
        {/* タイマー */}
        {timeRemaining !== null && (
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-white drop-shadow-lg">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-white/80 text-sm">残り時間</div>
          </div>
        )}
      </div>

      {/* 説明文 */}
      <p className="text-white/90 mb-4 text-center font-medium">
        {config.description}
      </p>

      {/* プログレスバー */}
      {timeRemaining !== null && (
        <div className="mb-4">
          <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-white/90 transition-all duration-1000 ease-linear rounded-full shadow-lg"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* プレイヤー統計 */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl font-bold text-white">
            {alivePlayers.length}
          </div>
          <div className="text-white/80 text-sm">
            生存者
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl font-bold text-blue-300">
            {humanPlayers.length}
          </div>
          <div className="text-white/80 text-sm">
            人間
          </div>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-300">
            {aiPlayers.length}
          </div>
          <div className="text-white/80 text-sm">
            AI
          </div>
        </div>
      </div>

      {/* フェーズ固有の情報 */}
      {gameState.phase === 'night' && (
        <div className="mt-4 p-3 bg-black/30 rounded-lg backdrop-blur-sm">
          <div className="text-white/90 text-sm text-center">
            🔍 能力者は対象を選択してください
          </div>
        </div>
      )}

      {gameState.phase === 'day_discussion' && (
        <div className="mt-4 p-3 bg-black/30 rounded-lg backdrop-blur-sm">
          <div className="text-white/90 text-sm text-center">
            💭 積極的に議論に参加しましょう
          </div>
        </div>
      )}

      {gameState.phase === 'day_vote' && (
        <div className="mt-4 p-3 bg-black/30 rounded-lg backdrop-blur-sm">
          <div className="text-white/90 text-sm text-center">
            ⚠️ 慎重に投票先を選んでください
          </div>
        </div>
      )}

      {/* 緊急度インジケーター */}
      {timeRemaining !== null && timeRemaining <= 30 && timeRemaining > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-red-600/90 text-white px-4 py-2 rounded-full animate-pulse">
            <span className="text-lg">⏰</span>
            <span className="font-bold">時間が少なくなっています！</span>
          </div>
        </div>
      )}
    </div>
  );
}