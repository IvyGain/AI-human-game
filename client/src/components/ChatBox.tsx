import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socket';
import { Player } from '@project-jin/shared';

export function ChatBox() {
  const { messages, gameState, currentPlayer } = useGameStore();
  const [inputMessage, setInputMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !currentPlayer || currentPlayer.status !== 'alive') {
      return;
    }

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('sendMessage', inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // @記号でメンション開始
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex >= 0 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtIndex >= 0) {
      const searchText = value.slice(lastAtIndex + 1).split(' ')[0];
      setMentionSearch(searchText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (player: Player) => {
    const lastAtIndex = inputMessage.lastIndexOf('@');
    const beforeMention = inputMessage.slice(0, lastAtIndex);
    const afterMention = inputMessage.slice(lastAtIndex + mentionSearch.length + 1);
    setInputMessage(`${beforeMention}@${player.name} ${afterMention}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const canSendMessage = gameState?.phase === 'day_discussion' && 
                         currentPlayer?.status === 'alive';

  const alivePlayers = gameState?.players.filter(p => 
    p.status === 'alive' && 
    p.name.toLowerCase().includes(mentionSearch.toLowerCase())
  ) || [];

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPlayerStatusIcon = (player?: Player) => {
    if (!player) return '❓';
    if (player.status === 'dead') return '💀';
    if (player.isBot) return '🤖';
    return '👤';
  };

  const getPlayerNameColor = (player?: Player) => {
    if (!player) return 'text-gray-400';
    if (player.status === 'dead') return 'text-gray-500 line-through';
    if (player.isBot) return 'text-purple-400';
    if (player.id === currentPlayer?.id) return 'text-green-400';
    return 'text-blue-400';
  };

  // システムメッセージかどうかを判定
  const isSystemMessage = (playerId: string) => {
    return playerId === 'system';
  };

  return (
    <div className="bg-gray-800 rounded-lg flex flex-col h-[500px]">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold">チャット</h3>
        <div className="text-xs text-gray-400">
          {canSendMessage ? '議論中' : '発言不可'}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const player = gameState?.players.find(p => p.id === message.playerId);
          const isSystem = isSystemMessage(message.playerId);
          
          if (isSystem) {
            return (
              <div key={message.id} className="text-center text-xs text-gray-500 italic">
                {message.content}
              </div>
            );
          }

          return (
            <div key={message.id} className="group hover:bg-gray-750 rounded p-2 -mx-2 transition-colors">
              <div className="flex items-start space-x-2">
                <span className="text-lg" title={player?.status}>
                  {getPlayerStatusIcon(player)}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline space-x-2">
                    <span className={`font-medium ${getPlayerNameColor(player)}`}>
                      {player?.name || '不明'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {player?.isBot && (
                      <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="text-gray-300 mt-0.5 break-words">
                    {message.content.split(/(@\w+)/).map((part, index) => {
                      if (part.startsWith('@')) {
                        return (
                          <span key={index} className="text-blue-400 font-medium">
                            {part}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* メンション候補 */}
      {showMentions && alivePlayers.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 bg-gray-700 rounded-lg shadow-lg p-2 max-h-40 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-1">プレイヤーを選択</div>
          {alivePlayers.map(player => (
            <div
              key={player.id}
              onClick={() => insertMention(player)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer"
            >
              <span>{getPlayerStatusIcon(player)}</span>
              <span className={getPlayerNameColor(player)}>
                {player.name}
              </span>
              {player.isBot && (
                <span className="text-xs bg-purple-900 text-purple-300 px-1 rounded">
                  AI
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="p-3 border-t border-gray-700">
        {!canSendMessage && currentPlayer?.status === 'alive' && (
          <div className="text-xs text-yellow-400 mb-2">
            議論フェーズでのみ発言できます
          </div>
        )}
        {currentPlayer?.status === 'dead' && (
          <div className="text-xs text-red-400 mb-2">
            死亡したプレイヤーは発言できません
          </div>
        )}
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={!canSendMessage}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={canSendMessage ? 'メッセージを入力... (@でメンション)' : '発言できません'}
          />
          <button
            onClick={sendMessage}
            disabled={!canSendMessage || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md font-medium transition"
          >
            送信
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">
            Enter: 送信 / @: メンション
          </div>
          <div className="text-xs text-gray-400">
            {inputMessage.length}/200
          </div>
        </div>
      </div>
    </div>
  );
}