import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface GameReplay {
  id: string;
  status: string;
  phase: string;
  turn: number;
  winner?: string;
  createdAt: string;
  endedAt?: string;
  participants: Array<{
    id: string;
    playerName: string;
    role?: string;
    faction?: string;
    status: string;
    eliminatedAt?: string;
    eliminationReason?: string;
  }>;
  chatMessages: Array<{
    id: string;
    playerName?: string;
    content: string;
    phase: string;
    turn: number;
    isSystem: boolean;
    createdAt: string;
  }>;
  nightActions: Array<{
    id: string;
    playerId: string;
    targetId?: string;
    actionType: string;
    turn: number;
    result?: string;
  }>;
  votes: Array<{
    id: string;
    voterId: string;
    targetId: string;
    turn: number;
  }>;
}

const ReplayPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const [replay, setReplay] = useState<GameReplay | null>(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<'NIGHT' | 'DAY_REPORT' | 'DAY_DISCUSSION' | 'DAY_VOTE' | 'EXECUTION'>('NIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (gameId) {
      fetchReplay();
    }
  }, [gameId]);

  useEffect(() => {
    if (isPlaying && replay) {
      const timer = setTimeout(() => {
        advanceReplay();
      }, 3000 / playbackSpeed);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentTurn, currentPhase, playbackSpeed]);

  const fetchReplay = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${gameId}/replay`);
      if (response.ok) {
        const data = await response.json();
        setReplay(data);
      } else {
        console.error('Failed to fetch replay');
      }
    } catch (error) {
      console.error('Fetch replay error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const advanceReplay = () => {
    if (!replay) return;
    
    const phases: typeof currentPhase[] = ['NIGHT', 'DAY_REPORT', 'DAY_DISCUSSION', 'DAY_VOTE', 'EXECUTION'];
    const currentPhaseIndex = phases.indexOf(currentPhase);
    
    if (currentPhaseIndex < phases.length - 1) {
      setCurrentPhase(phases[currentPhaseIndex + 1]);
    } else {
      // 次のターンへ
      const maxTurn = Math.max(...replay.chatMessages.map(m => m.turn), 1);
      if (currentTurn < maxTurn) {
        setCurrentTurn(currentTurn + 1);
        setCurrentPhase('NIGHT');
      } else {
        // リプレイ終了
        setIsPlaying(false);
      }
    }
  };

  const jumpToTurn = (turn: number, phase: typeof currentPhase) => {
    setCurrentTurn(turn);
    setCurrentPhase(phase);
    setIsPlaying(false);
  };

  const getRoleIcon = (role: string) => {
    const roleIcons: { [key: string]: string } = {
      'AI': '🤖',
      'ENGINEER': '🔍',
      'CYBER_GUARD': '🛡️',
      'CITIZEN': '👤',
      'FAKE_AI': '🎭',
      'TRICKSTER': '🃏'
    };
    return roleIcons[role] || '❓';
  };

  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'HUMAN': return 'text-blue-400';
      case 'AI': return 'text-red-400';
      case 'THIRD': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getPhaseJapanese = (phase: string) => {
    const phaseNames: { [key: string]: string } = {
      'NIGHT': '夜フェーズ',
      'DAY_REPORT': '結果報告',
      'DAY_DISCUSSION': '議論フェーズ',
      'DAY_VOTE': '投票フェーズ',
      'EXECUTION': '処刑フェーズ'
    };
    return phaseNames[phase] || phase;
  };

  const getActionTypeJapanese = (actionType: string) => {
    const actionNames: { [key: string]: string } = {
      'INVESTIGATE': '調査',
      'PROTECT': '守護',
      'ATTACK': '襲撃'
    };
    return actionNames[actionType] || actionType;
  };

  const getPlayerById = (playerId: string) => {
    return replay?.participants.find(p => p.id === playerId);
  };

  const getCurrentMessages = () => {
    if (!replay) return [];
    
    return replay.chatMessages.filter(msg => {
      if (msg.turn < currentTurn) return true;
      if (msg.turn === currentTurn) {
        const phases: typeof currentPhase[] = ['NIGHT', 'DAY_REPORT', 'DAY_DISCUSSION', 'DAY_VOTE', 'EXECUTION'];
        const msgPhaseIndex = phases.indexOf(msg.phase as typeof currentPhase);
        const currentPhaseIndex = phases.indexOf(currentPhase);
        return msgPhaseIndex <= currentPhaseIndex;
      }
      return false;
    });
  };

  const getCurrentNightActions = () => {
    if (!replay || currentPhase === 'NIGHT') return [];
    return replay.nightActions.filter(action => action.turn === currentTurn);
  };

  const getCurrentVotes = () => {
    if (!replay || currentPhase !== 'EXECUTION') return [];
    return replay.votes.filter(vote => vote.turn === currentTurn);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-300 mt-4">リプレイを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">リプレイが見つかりません</p>
          <button
            onClick={() => navigate('/stats')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">🎮 ゲームリプレイ</h1>
              <div className="text-gray-300 mt-2">
                {new Date(replay.createdAt).toLocaleString('ja-JP')} • 
                ターン {currentTurn} • {getPhaseJapanese(currentPhase)}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={showSpoilers}
                  onChange={(e) => setShowSpoilers(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>ネタバレ表示</span>
              </label>
              <button
                onClick={() => navigate('/stats')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                戻る
              </button>
            </div>
          </div>
        </div>

        {/* プレイバックコントロール */}
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => jumpToTurn(1, 'NIGHT')}
              className="text-white hover:text-blue-400 transition-colors"
              title="最初へ"
            >
              ⏮️
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? '⏸️ 一時停止' : '▶️ 再生'}
            </button>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-black/50 text-white px-3 py-2 rounded border border-gray-600"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 参加者リスト */}
          <div className="lg:col-span-1">
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">参加者</h2>
              <div className="space-y-3">
                {replay.participants.map(participant => {
                  const isEliminated = participant.eliminatedAt && 
                    new Date(participant.eliminatedAt) <= new Date(replay.chatMessages.find(m => m.turn === currentTurn && m.phase === currentPhase)?.createdAt || '');
                  
                  return (
                    <div
                      key={participant.id}
                      className={`p-3 rounded-lg border ${
                        isEliminated
                          ? 'bg-gray-900/50 border-gray-700 opacity-50'
                          : 'bg-black/30 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-semibold">
                            {participant.playerName}
                          </div>
                          {(showSpoilers || isEliminated) && participant.role && (
                            <div className="text-sm mt-1">
                              <span className="mr-2">{getRoleIcon(participant.role)}</span>
                              <span className={getFactionColor(participant.faction || '')}>
                                {participant.role.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                          {isEliminated && (
                            <div className="text-xs text-red-400 mt-1">
                              {participant.eliminationReason === 'vote' ? '投票で追放' : 
                               participant.eliminationReason === 'attack' ? '襲撃された' : '切断'}
                            </div>
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          isEliminated ? 'bg-gray-500' : 'bg-green-500'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 夜アクション表示 */}
              {currentPhase !== 'NIGHT' && getCurrentNightActions().length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">夜の行動</h3>
                  <div className="space-y-2">
                    {getCurrentNightActions().map(action => {
                      const actor = getPlayerById(action.playerId);
                      const target = action.targetId ? getPlayerById(action.targetId) : null;
                      
                      return (
                        <div key={action.id} className="bg-black/20 rounded p-2 text-sm">
                          <div className="text-gray-300">
                            <span className="text-white">{actor?.playerName}</span> が
                            {target && <span className="text-white"> {target.playerName} </span>}
                            に<span className="text-yellow-400">{getActionTypeJapanese(action.actionType)}</span>
                          </div>
                          {action.result && (
                            <div className="text-xs text-gray-400 mt-1">
                              結果: {action.result}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 投票結果表示 */}
              {currentPhase === 'EXECUTION' && getCurrentVotes().length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">投票結果</h3>
                  <div className="space-y-2">
                    {(() => {
                      const voteCount = new Map<string, number>();
                      const voters = new Map<string, string[]>();
                      
                      getCurrentVotes().forEach(vote => {
                        voteCount.set(vote.targetId, (voteCount.get(vote.targetId) || 0) + 1);
                        const voter = getPlayerById(vote.voterId);
                        if (voter) {
                          const current = voters.get(vote.targetId) || [];
                          voters.set(vote.targetId, [...current, voter.playerName]);
                        }
                      });
                      
                      return Array.from(voteCount.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(([targetId, count]) => {
                          const target = getPlayerById(targetId);
                          return (
                            <div key={targetId} className="bg-black/20 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span className="text-white font-semibold">
                                  {target?.playerName}
                                </span>
                                <span className="text-red-400 font-bold">{count}票</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {voters.get(targetId)?.join(', ')}
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* チャットログ */}
          <div className="lg:col-span-2">
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">チャットログ</h2>
              <div className="bg-black/20 rounded-lg p-4 h-[600px] overflow-y-auto">
                {getCurrentMessages().map(message => (
                  <div key={message.id} className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">
                      ターン{message.turn} • {getPhaseJapanese(message.phase)}
                    </div>
                    <div className={`${
                      message.isSystem 
                        ? 'text-yellow-400 italic' 
                        : 'text-white'
                    }`}>
                      {!message.isSystem && (
                        <span className="font-semibold text-blue-300">
                          {message.playerName}:{' '}
                        </span>
                      )}
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* ゲーム結果 */}
              {replay.winner && currentTurn >= Math.max(...replay.chatMessages.map(m => m.turn), 1) && (
                <div className="mt-6 bg-black/20 rounded-lg p-6 text-center">
                  <div className="text-3xl mb-2">
                    {replay.winner === 'human' ? '🎉' : replay.winner === 'ai' ? '🤖' : '🃏'}
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {replay.winner === 'human' ? '人間陣営' : 
                     replay.winner === 'ai' ? 'AI陣営' : 
                     '第三陣営'}の勝利！
                  </div>
                  <div className="text-gray-300">
                    ゲーム終了: {new Date(replay.endedAt || '').toLocaleString('ja-JP')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplayPage;