import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface VoiceChatProps {
  enabled: boolean;
}

export function VoiceChat({ enabled }: VoiceChatProps) {
  const { gameState, currentPlayer } = useGameStore();

  const [isMuted, setIsMuted] = useState(false);
  const [mutedPlayers, setMutedPlayers] = useState<Set<string>>(new Set());
  const [speakingPlayers, setSpeakingPlayers] = useState<Set<string>>(new Set());
  const [pushToTalk, setPushToTalk] = useState(true);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (enabled && currentPlayer?.status === 'alive') {
      initializeVoiceChat();
    }
    
    return () => {
      cleanupVoiceChat();
    };
  }, [enabled, currentPlayer]);

  const initializeVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // 音声レベル検知用のオーディオコンテキスト設定
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // 音声レベルの監視開始
      detectVoiceActivity();
    } catch (error) {
      console.error('Voice chat initialization failed:', error);
    }
  };

  const detectVoiceActivity = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // 音声アクティビティの閾値
      if (average > 30) {
        if (!pushToTalk) {
          // 音声送信中の処理
          setSpeakingPlayers(prev => new Set([...prev, currentPlayer?.id || '']));
        }
      } else {
        setSpeakingPlayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentPlayer?.id || '');
          return newSet;
        });
      }
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };

  const cleanupVoiceChat = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const togglePlayerMute = (playerId: string) => {
    setMutedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };



  const canUseVoice = gameState?.phase === 'day_discussion' && 
                     currentPlayer?.status === 'alive' && 
                     enabled;

  const alivePlayers = gameState?.players.filter(p => p.status === 'alive') || [];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">ボイスチャット</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPushToTalk(!pushToTalk)}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            {pushToTalk ? 'プッシュトゥトーク' : '常時発言'}
          </button>
        </div>
      </div>

      {!canUseVoice && (
        <div className="text-sm text-gray-400 text-center py-4">
          {!enabled ? 'ボイスチャットは無効です' : '議論フェーズでのみ使用可能'}
        </div>
      )}

      {canUseVoice && (
        <>
          {/* 自分のコントロール */}
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span className="font-medium">{currentPlayer?.name}</span>
              </div>
              <button
                onClick={toggleMute}
                className={`px-3 py-1 rounded text-sm transition ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {isMuted ? 'ミュート中' : 'ミュート'}
              </button>
            </div>
            {pushToTalk && (
              <div className="mt-2 text-xs text-gray-400">
                スペースキーを押しながら話してください
              </div>
            )}
          </div>

          {/* 他のプレイヤー */}
          <div className="space-y-2">
            <div className="text-sm text-gray-400 mb-2">参加者</div>
            {alivePlayers
              .filter(p => p.id !== currentPlayer?.id)
              .map(player => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      speakingPlayers.has(player.id) ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-sm">
                      {player.name}
                      {player.isBot && (
                        <span className="ml-2 text-xs bg-purple-900 text-purple-300 px-1 rounded">
                          AI
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => togglePlayerMute(player.id)}
                    className={`px-2 py-0.5 rounded text-xs transition ${
                      mutedPlayers.has(player.id)
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {mutedPlayers.has(player.id) ? 'ミュート中' : 'ミュート'}
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}