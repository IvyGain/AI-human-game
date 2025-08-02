import { GameState, Player, ChatMessage, NightAction, VotingResult, GamePhase } from './game';

export interface MessageReaction {
  messageId: string;
  emoji: string;
  playerIds: string[];
}

export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  phaseChange: (phase: GamePhase) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  chatMessage: (message: ChatMessage) => void;
  nightResult: (casualties: string[]) => void;
  voteResult: (results: { playerId: string; votes: number }[]) => void;
  gameEnd: (winner: string, finalState: GameState) => void;
  error: (message: string) => void;
  messageReaction: (reaction: MessageReaction) => void;
  playerVoiceState: (playerId: string, isSpeaking: boolean) => void;
  systemMessage: (content: string) => void;
}

export interface ClientToServerEvents {
  joinGame: (gameId: string, playerName: string) => void;
  leaveGame: () => void;
  nightAction: (action: Omit<NightAction, 'turn'>) => void;
  vote: (targetId: string) => void;
  sendMessage: (content: string) => void;
  startGame: () => void;
  addReaction: (data: { messageId: string; emoji: string }) => void;
  removeReaction: (data: { messageId: string; emoji: string }) => void;
  voiceStateChange: (isSpeaking: boolean) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  gameId?: string;
  playerId?: string;
}