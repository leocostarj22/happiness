import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Socket } from 'socket.io-client';
import { Game, Player, Vote, Question, GameMode } from '@/types/game';
import { socket } from '@/lib/socket';
import { useAuthStore } from './authStore';

interface GameStore {
  socket: Socket;
  game: Game | null;
  players: Player[];
  votes: Vote[];
  showResults: boolean;
  currentPlayer: Player | null;
  error: string | null;
  
  // Game actions
  createGame: (name: string, mode: GameMode) => void;
  loadGame: (gameId: string) => void;
  clearGame: () => void;
  deleteGame: (gameId: string) => Promise<boolean>;
  resetGame: (gameId: string) => Promise<boolean>;
  openLobby: () => void;
  startGame: () => void;
  nextQuestion: () => void; // TODO: Implement on backend
  
  // Player actions
  joinGame: (gameId: string, name: string) => void;
  leaveGame: () => void;
  clearError: () => void;
  
  // Voting actions
  submitVote: (playerId: string, optionIndex: number) => void;
  showQuestionResults: () => void; // TODO: Implement sync
  
  // Utilities
  getGameCode: () => string;
  getCurrentQuestion: () => Question | null;
  getVoteResults: () => { option: string; count: number; percentage: number }[];
  getPlayerRanking: () => Player[];
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      // Listen for global state updates from server
      socket.on('gameStateUpdate', (serverState) => {
        console.log('Received gameStateUpdate:', serverState);
        
        // Normalize votes to ensure camelCase keys (handle potential snake_case from server)
        const normalizedVotes = serverState.votes ? serverState.votes.map((v: any) => ({
           id: v.id,
           gameId: v.gameId || v.game_id,
           playerId: v.playerId || v.player_id,
           questionId: v.questionId || v.question_id,
           optionIndex: (v.optionIndex !== undefined) ? v.optionIndex : v.option_index,
           createdAt: v.createdAt || v.created_at
        })) : [];

        if (serverState.game) {
           console.log(`Game Status: ${serverState.game.status}, Questions: ${serverState.game.questions?.length}`);
        }
        set({
          game: serverState.game,
          players: serverState.players,
          votes: normalizedVotes,
          showResults: serverState.showResults
        });
      });

      socket.on('gameCreated', ({ gameId, name, mode }) => {
        // Set initial game state so the UI advances
        set({ 
          game: {
            id: gameId,
            name,
            mode,
            status: 'waiting',
            questions: [],
            currentQuestionIndex: 0
          }
        });
      });

      socket.on('playerJoined', (player) => {
         set({ currentPlayer: player, error: null });
      });

      socket.on('error', (message) => {
        set({ error: message });
      });

      return {
        socket,
        game: null,
        players: [],
        votes: [],
        showResults: false,
        currentPlayer: null,
        error: null,

        createGame: (name, mode) => {
          set({ error: null });
          const token = useAuthStore.getState().token;
          socket.emit('createGame', { name, mode, token });
        },

        loadGame: (gameId) => {
           socket.emit('requestState', { gameId });
        },

        openLobby: () => {
           const { game } = get();
           if (game) {
              socket.emit('openLobby', { gameId: game.id });
           }
        },

        deleteGame: async (gameId) => {
           const token = useAuthStore.getState().token;
           return new Promise((resolve) => {
              socket.emit('deleteGame', { gameId, token }, (response: any) => {
                 resolve(response.success);
              });
           });
        },

        resetGame: async (gameId) => {
           const token = useAuthStore.getState().token;
           return new Promise((resolve) => {
              socket.emit('resetGame', { gameId, token }, (response: any) => {
                 resolve(response.success);
              });
           });
        },

        joinGame: (gameId, name) => {
          set({ error: null });
          const avatar = ['🎉', '🎊', '🎈', '🎁', '🌟'][Math.floor(Math.random() * 5)];
          socket.emit('joinGame', { gameId, playerName: name, avatar });
        },

        leaveGame: () => {
          const { game, currentPlayer } = get();
          if (game && currentPlayer) {
             socket.emit('leaveGame', { gameId: game.id, playerId: currentPlayer.id });
          }
          set({ currentPlayer: null, game: null, players: [] });
        },

        clearError: () => set({ error: null }),

        startGame: () => {
          const { game } = get();
          if (game) socket.emit('startGame', { gameId: game.id });
        },

        nextQuestion: () => {
          const { game } = get();
          if (game) {
             socket.emit('nextQuestion', { gameId: game.id });
          }
        }, 
        
        addQuestion: (questionData) => {
          const { game } = get();
          if (game) {
            socket.emit('addQuestion', { gameId: game.id, question: questionData });
          }
        },
        removeQuestion: (questionId) => {
          const { game } = get();
          if (game) {
            socket.emit('removeQuestion', { gameId: game.id, questionId });
          }
        },
        removePlayer: () => {},
        endGame: () => {},
        clearGame: () => set({ game: null, players: [], votes: [] }),

        submitVote: (playerId, optionIndex) => {
          const { game, getCurrentQuestion, players } = get();
          const question = getCurrentQuestion();
          if (game && question) {
            let targetPlayerId: string | undefined;
            
            // If voting for a player, identify who it is
            if (question.usePlayersAsOptions && players && players[optionIndex]) {
               targetPlayerId = players[optionIndex].id;
            }

            socket.emit('submitVote', { 
              gameId: game.id, 
              playerId, 
              questionId: question.id, 
              optionIndex,
              targetPlayerId
            });
          }
        },

        showQuestionResults: () => {
           const { game } = get();
           if (game) {
              socket.emit('showQuestionResults', { gameId: game.id });
           }
        },
        hideResults: () => set({ showResults: false }),

        getGameCode: () => get().game?.id || '',
        
        getCurrentQuestion: () => {
          const { game } = get();
          if (!game || !game.questions) return null;
          return game.questions[game.currentQuestionIndex] || null;
        },

        getVoteResults: () => {
          const { game, votes, players } = get();
          if (!game) return [];
          const currentQuestion = game.questions[game.currentQuestionIndex];
          if (!currentQuestion) return [];
          
          const questionVotes = votes.filter((v) => v.questionId === currentQuestion.id);
          const totalVotes = questionVotes.length;
          
          const displayOptions = currentQuestion.usePlayersAsOptions 
            ? players.map(p => `${p.avatar} ${p.name}`)
            : currentQuestion.options;
          
          return displayOptions.map((option, index) => {
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
      };
    },
    {
      name: 'party-joy-hub-client',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentPlayer: state.currentPlayer,
        game: state.game // Persist game info too for reconnection
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.currentPlayer && state.game) {
          console.log('Attempting reconnection for:', state.currentPlayer.name);
          socket.emit('joinGame', {
             gameId: state.game.id,
             playerName: state.currentPlayer.name,
             avatar: state.currentPlayer.avatar 
          });
        }
      }
    }
  )
);