import React, { useRef, useEffect, useState } from 'react';
import { Player } from '@project-jin/shared';
import { useAnimations, useButtonAnimations } from '../hooks/useAnimations';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  canVote?: boolean;
  onVote?: (playerId: string) => void;
  selectedVote?: string;
}

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  canVote: boolean;
  isSelected: boolean;
  onVote?: (playerId: string) => void;
  onElimination?: (element: HTMLElement, method: 'attack' | 'vote') => void;
}

function PlayerCard({ 
  player, 
  isCurrentPlayer, 
  canVote, 
  isSelected, 
  onVote,
  onElimination 
}: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [wasAlive, setWasAlive] = useState(player.status === 'alive');
  const { animateAction } = useAnimations();
  const { getButtonClasses } = useButtonAnimations();

  // プレイヤーが排除された時のアニメーション
  useEffect(() => {
    if (wasAlive && player.status === 'dead') {
      setWasAlive(false);
      if (cardRef.current && onElimination) {
        onElimination(cardRef.current, 'attack'); // デフォルトで attack
      }
    }
  }, [player.status, wasAlive, onElimination]);

  const handleVote = () => {
    if (canVote && onVote && player.status === 'alive' && !isCurrentPlayer) {
      onVote(player.id);
      
      // 投票アニメーション
      if (cardRef.current) {
        animateAction(cardRef.current, 'vote');
      }
    }
  };

  const getRoleDisplay = () => {
    if (!player.role) return null;
    
    const roleIcons = {
      engineer: '🔍',
      cyber_guard: '🛡️',
      citizen: '👤',
      ai: '🤖',
      fake_ai: '🎭',
      trickster: '🃏'
    };

    return (
      <div className="flex items-center space-x-1">
        <span>{roleIcons[player.role.name]}</span>
        <span className="text-xs">{player.role.name}</span>
      </div>
    );
  };

  const getPlayerAura = () => {
    if (player.status === 'dead') {
      return 'shadow-lg shadow-red-500/20 border-2 border-red-800/50';
    }
    if (isCurrentPlayer) {
      return 'shadow-lg shadow-green-500/30 border-2 border-green-500/50';
    }
    if (isSelected) {
      return 'shadow-lg shadow-yellow-500/30 border-2 border-yellow-500/50';
    }
    if (player.isBot) {
      return 'shadow-lg shadow-purple-500/20 border-2 border-purple-500/30';
    }
    return 'shadow-lg border-2 border-gray-600/30';
  };

  const getPlayerNameColor = () => {
    if (player.status === 'dead') return 'text-gray-500';
    if (isCurrentPlayer) return 'text-green-400';
    if (player.isBot) return 'text-purple-400';
    return 'text-white';
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative p-4 rounded-xl backdrop-blur-sm transition-all duration-300
        ${player.status === 'dead' 
          ? 'bg-gray-900/70 grayscale' 
          : 'bg-gray-800/80 hover:bg-gray-700/80'
        }
        ${getPlayerAura()}
        ${canVote && player.status === 'alive' && !isCurrentPlayer 
          ? 'cursor-pointer hover:scale-105' 
          : ''
        }
      `}
      onClick={handleVote}
    >
      {/* ステータスインジケーター */}
      <div className="absolute top-2 right-2 flex items-center space-x-1">
        <div
          className={`w-3 h-3 rounded-full ${
            player.status === 'alive' 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`}
        />
        {player.isBot && (
          <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full">
            AI
          </span>
        )}
      </div>

      {/* プレイヤーアバター */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-2xl
          ${player.status === 'alive' 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
            : 'bg-gradient-to-br from-gray-600 to-gray-800'
          }
        `}>
          {player.isBot ? '🤖' : '👤'}
        </div>
        
        <div className="flex-1">
          <h4 className={`font-bold text-lg ${getPlayerNameColor()}`}>
            {player.name}
          </h4>
          {getRoleDisplay() && (
            <div className="text-gray-400 text-sm">
              {getRoleDisplay()}
            </div>
          )}
        </div>
      </div>

      {/* プレイヤー情報 */}
      <div className="space-y-2">
        {isCurrentPlayer && (
          <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-2">
            <span className="text-green-400 text-sm font-medium">
              🌟 あなた
            </span>
          </div>
        )}

        {player.status === 'dead' && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-2">
            <span className="text-red-400 text-sm font-medium">
              💀 排除済み
            </span>
          </div>
        )}

        {/* 投票ボタン */}
        {canVote && player.status === 'alive' && !isCurrentPlayer && (
          <button
            className={getButtonClasses(
              isSelected ? 'danger' : 'secondary', 
              'sm'
            )}
            onClick={handleVote}
          >
            {isSelected ? '投票中' : '投票する'}
          </button>
        )}
      </div>

      {/* 選択インジケーター */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-yellow-400 rounded-xl animate-pulse" />
      )}

      {/* 死亡エフェクトオーバーレイ */}
      {player.status === 'dead' && (
        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
          <span className="text-4xl opacity-70">💀</span>
        </div>
      )}
    </div>
  );
}

export function PlayerList({ 
  players, 
  currentPlayerId, 
  canVote = false, 
  onVote, 
  selectedVote 
}: PlayerListProps) {
  const { animatePlayerElimination } = useAnimations();

  const alivePlayers = players.filter(p => p.status === 'alive');
  const deadPlayers = players.filter(p => p.status === 'dead');

  const handleElimination = (element: HTMLElement, method: 'attack' | 'vote') => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    animatePlayerElimination(element, method, centerX, centerY);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">プレイヤー</h3>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-green-400">
            生存: {alivePlayers.length}
          </span>
          {deadPlayers.length > 0 && (
            <span className="text-red-400">
              排除: {deadPlayers.length}
            </span>
          )}
        </div>
      </div>

      {/* 生存プレイヤー */}
      {alivePlayers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
            生存者
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alivePlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                canVote={canVote}
                isSelected={selectedVote === player.id}
                onVote={onVote}
                onElimination={handleElimination}
              />
            ))}
          </div>
        </div>
      )}

      {/* 排除済みプレイヤー */}
      {deadPlayers.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2" />
            排除済み
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deadPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isCurrentPlayer={player.id === currentPlayerId}
                canVote={false}
                isSelected={false}
                onElimination={handleElimination}
              />
            ))}
          </div>
        </div>
      )}

      {/* 投票セクション */}
      {canVote && (
        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="text-center">
            <h4 className="text-yellow-400 font-semibold mb-2">
              🗳️ 投票フェーズ
            </h4>
            <p className="text-yellow-300 text-sm">
              {selectedVote 
                ? '投票を変更するには別のプレイヤーをクリックしてください'
                : '追放したいプレイヤーをクリックして投票してください'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}