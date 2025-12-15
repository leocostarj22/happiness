export type GameMode = 'voting' | 'quiz';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number; // For quiz mode
  timeLimit: number; // in seconds
  usePlayersAsOptions?: boolean; // For voting mode - use connected players as options
}

export interface Game {
  id: string;
  name: string;
  mode: GameMode;
  questions: Question[];
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
}

export interface Vote {
  playerId: string;
  questionId: string;
  optionIndex: number;
}

export interface GameState {
  game: Game | null;
  players: Player[];
  votes: Vote[];
  showResults: boolean;
}
