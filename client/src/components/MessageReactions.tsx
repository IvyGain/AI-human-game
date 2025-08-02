import React, { useState } from 'react';
import { socketService } from '../services/socket';

interface MessageReaction {
  emoji: string;
  label: string;
  playerIds: string[];
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  currentPlayerId?: string;
  canReact: boolean;
}

const AVAILABLE_REACTIONS = [
  { emoji: '👍', label: '同意' },
  { emoji: '🤔', label: '疑問' },
  { emoji: '😱', label: '驚き' },
  { emoji: '🤨', label: '怪しい' },
  { emoji: '💡', label: 'なるほど' },
  { emoji: '❓', label: '不明' },
  { emoji: '🎯', label: '核心' },
  { emoji: '⚠️', label: '警告' }
];

export function MessageReactions({ 
  messageId, 
  reactions = [], 
  currentPlayerId,
  canReact 
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    if (!canReact || !currentPlayerId) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('addReaction', { messageId, emoji });
    }
    setShowPicker(false);
  };

  const hasReacted = (reaction: MessageReaction): boolean => {
    return currentPlayerId ? reaction.playerIds.includes(currentPlayerId) : false;
  };

  const removeReaction = (emoji: string) => {
    if (!canReact || !currentPlayerId) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('removeReaction', { messageId, emoji });
    }
  };

  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* 既存のリアクション */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => hasReacted(reaction) ? removeReaction(reaction.emoji) : handleReaction(reaction.emoji)}
          className={`
            inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs
            transition-all duration-200
            ${hasReacted(reaction) 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
            ${canReact ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
          `}
          disabled={!canReact}
          title={`${reaction.label} (${reaction.playerIds.length}人)`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.playerIds.length}</span>
        </button>
      ))}

      {/* リアクション追加ボタン */}
      {canReact && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 transition-colors"
            title="リアクション追加"
          >
            <span className="text-sm">+</span>
          </button>

          {/* リアクションピッカー */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-xl p-2 grid grid-cols-4 gap-1 z-10">
              {AVAILABLE_REACTIONS.map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => handleReaction(item.emoji)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
                  title={item.label}
                >
                  <span className="text-lg">{item.emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}