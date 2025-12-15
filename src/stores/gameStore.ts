import { create } from 'zustand';
import { Game, Player, Vote, Question, GameMode } from '@/types/game';

interface GameStore {
  game: Game | null;
  players: Player[];
  votes: Vote[];
  showResults: boolean;
  currentPlayer: Player | null;
  
  // Game actions
  createGame: (name: string, mode: GameMode) => void;
  addQuestion: (question: Omit<Question, 'id'>) => void;
  removeQuestion: (id: string) => void;
  startGame: () => void;
  nextQuestion: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // Player actions
  joinGame: (name: string) => Player;
  removePlayer: (id: string) => void;
  
  // Voting actions
  submitVote: (playerId: string, optionIndex: number) => void;
  showQuestionResults: () => void;
  hideResults: () => void;
  
  // Utilities
  getGameCode: () => string;
  getCurrentQuestion: () => Question | null;
  getVoteResults: () => { option: string; count: number; percentage: number }[];
  getPlayerRanking: () => Player[];
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateGameCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const avatars = ['🎉', '🎊', '🎈', '🎁', '🌟', '⭐', '🔥', '💫', '🚀', '🎯', '🎪', '🎭'];

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  players: [],
  votes: [],
  showResults: false,
  currentPlayer: null,

  createGame: (name, mode) => {
    const game: Game = {
      id: generateGameCode(),
      name,
      mode,
      questions: [],
      status: 'waiting',
      currentQuestionIndex: 0,
    };
    set({ game, players: [], votes: [], showResults: false });
  },

  addQuestion: (questionData) => {
    const { game } = get();
    if (!game) return;
    
    const question: Question = {
      ...questionData,
      id: generateId(),
    };
    
    set({
      game: {
        ...game,
        questions: [...game.questions, question],
      },
    });
  },

  removeQuestion: (id) => {
    const { game } = get();
    if (!game) return;
    
    set({
      game: {
        ...game,
        questions: game.questions.filter((q) => q.id !== id),
      },
    });
  },

  startGame: () => {
    const { game } = get();
    if (!game || game.questions.length === 0) return;
    
    set({
      game: { ...game, status: 'playing', currentQuestionIndex: 0 },
      votes: [],
      showResults: false,
    });
  },

  nextQuestion: () => {
    const { game } = get();
    if (!game) return;
    
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex >= game.questions.length) {
      set({ game: { ...game, status: 'finished' } });
    } else {
      set({
        game: { ...game, currentQuestionIndex: nextIndex },
        votes: [],
        showResults: false,
      });
    }
  },

  endGame: () => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, status: 'finished' } });
  },

  resetGame: () => {
    set({ game: null, players: [], votes: [], showResults: false, currentPlayer: null });
  },

  joinGame: (name) => {
    const player: Player = {
      id: generateId(),
      name,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      score: 0,
      connected: true,
    };
    
    set((state) => ({
      players: [...state.players, player],
      currentPlayer: player,
    }));
    
    return player;
  },

  removePlayer: (id) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    }));
  },

  submitVote: (playerId, optionIndex) => {
    const { game, votes, players } = get();
    if (!game) return;
    
    const currentQuestion = game.questions[game.currentQuestionIndex];
    if (!currentQuestion) return;
    
    // Check if player already voted
    const existingVote = votes.find(
      (v) => v.playerId === playerId && v.questionId === currentQuestion.id
    );
    if (existingVote) return;
    
    const vote: Vote = {
      playerId,
      questionId: currentQuestion.id,
      optionIndex,
    };
    
    // Update score for quiz mode
    let updatedPlayers = players;
    if (game.mode === 'quiz' && currentQuestion.correctAnswer === optionIndex) {
      updatedPlayers = players.map((p) =>
        p.id === playerId ? { ...p, score: p.score + 100 } : p
      );
    }
    
    set({
      votes: [...votes, vote],
      players: updatedPlayers,
    });
  },

  showQuestionResults: () => {
    set({ showResults: true });
  },

  hideResults: () => {
    set({ showResults: false });
  },

  getGameCode: () => {
    const { game } = get();
    return game?.id || '';
  },

  getCurrentQuestion: () => {
    const { game } = get();
    if (!game) return null;
    return game.questions[game.currentQuestionIndex] || null;
  },

  getVoteResults: () => {
    const { game, votes } = get();
    if (!game) return [];
    
    const currentQuestion = game.questions[game.currentQuestionIndex];
    if (!currentQuestion) return [];
    
    const questionVotes = votes.filter((v) => v.questionId === currentQuestion.id);
    const totalVotes = questionVotes.length;
    
    return currentQuestion.options.map((option, index) => {
      const count = questionVotes.filter((v) => v.optionIndex === index).length;
      return {
        option,
        count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      };
    });
  },

  getPlayerRanking: () => {
    const { players } = get();
    return [...players].sort((a, b) => b.score - a.score);
  },
}));
