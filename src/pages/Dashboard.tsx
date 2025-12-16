import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QRCodeDisplay from '@/components/game/QRCodeDisplay';
import PlayerList from '@/components/game/PlayerList';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import RankingDisplay from '@/components/game/RankingDisplay';
import { Button } from '@/components/ui/button';
import { Play, SkipForward, BarChart3, Gamepad2 } from 'lucide-react';
import { socket } from '@/lib/socket';

const Dashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [searchParams] = useSearchParams();
  const gameIdFromUrl = searchParams.get('gameId');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const {
    game,
    players,
    startGame,
    nextQuestion,
    showResults,
    showQuestionResults,
    getCurrentQuestion,
    getVoteResults,
    getPlayerRanking,
  } = useGameStore();

  const [lastVoters, setLastVoters] = useState<{id: string, name: string, avatar: string}[]>([]);

  useEffect(() => {
    const handleVoteCast = (voter: { playerId: string, name: string, avatar: string }) => {
       const id = Math.random().toString(36); // Unique ID for this notification instance
       setLastVoters(prev => [...prev, { ...voter, id }]);
       
       // Remove after 3 seconds
       setTimeout(() => {
         setLastVoters(prev => prev.filter(v => v.id !== id));
       }, 3000);
    };

    socket.on('voteCast', handleVoteCast);
    return () => {
      socket.off('voteCast', handleVoteCast);
    };
  }, []);

  const safePlayers = Array.isArray(players) ? players : [];

  useEffect(() => {
    const targetGameId = gameIdFromUrl || game?.id;
    if (targetGameId) {
      socket.emit('requestState', { gameId: targetGameId });
    }
  }, [game?.id, gameIdFromUrl]);

  if (!game || game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-happiness-yellow/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-happiness-pink/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="text-center space-y-8 animate-slide-up relative z-10">
          <div>
            <h1 className="font-display text-8xl md:text-9xl gradient-text tracking-tight mb-4">
              Happiness
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-2xl mx-auto font-light">
              Prepare-se para a diversão!
            </p>
          </div>
          
          <div className="p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl inline-block">
            <div className="flex flex-col items-center gap-4">
               <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center animate-pulse">
                  <Gamepad2 className="w-10 h-10 text-muted-foreground" />
               </div>
               <p className="text-muted-foreground">
                 {game && game.status === 'waiting' 
                   ? 'O organizador está preparando o jogo...' 
                   : 'Aguardando o organizador iniciar o jogo...'}
               </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const voteResults = getVoteResults();
  const ranking = getPlayerRanking();
  
  // Safety check: If we are "playing" but index is out of bounds, treat as finished
  const isGameFinished = game.status === 'finished' || (game.status === 'playing' && game.currentQuestionIndex >= game.questions.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl gradient-text">Hapiness</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {game.mode === 'quiz' ? '🎯 Quiz' : '🗳️ Votação'}
            </span>
            <span className="font-display text-lg text-primary">
              {game.name}
            </span>
            <span className="bg-muted px-3 py-1 rounded-full text-sm">
              {safePlayers.length} jogadores
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Waiting for players (Lobby) */}
        {game.status === 'lobby' && (
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h2 className="font-display text-4xl text-foreground mb-2">
                  Entre no jogo!
                </h2>
                <p className="text-muted-foreground text-lg">
                  Escaneie o QR Code ou digite o código
                </p>
              </div>
              <div className="flex justify-center lg:justify-start">
                <QRCodeDisplay gameCode={game.id} size={250} />
              </div>
              {/* Only show start button if there are questions, but usually Admin starts it */}
              {game.questions.length > 0 && (
                <div className="flex justify-center lg:justify-start">
                   <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      Aguarde o organizador iniciar a partida pelo painel de controle.
                   </div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <h3 className="font-display text-2xl text-foreground">
                Jogadores Conectados
              </h3>
              <PlayerList players={safePlayers} />
            </div>
          </div>
        )}

        {/* Playing */}
        {game.status === 'playing' && currentQuestion && (
          <div className="space-y-8">
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={game.currentQuestionIndex + 1}
              totalQuestions={game.questions.length}
              showResults={showResults}
              voteResults={voteResults}
              correctAnswer={
                game.mode === 'quiz' ? currentQuestion.correctAnswer : undefined
              }
              players={players}
            />

            <div className="flex justify-center gap-4">
              {!showResults ? (
                <Button variant="gradient" size="lg" onClick={showQuestionResults}>
                  <BarChart3 className="w-5 h-5" />
                  Ver Resultados
                </Button>
              ) : (
                <Button variant="gradient" size="lg" onClick={nextQuestion}>
                  <SkipForward className="w-5 h-5" />
                  {game.currentQuestionIndex + 1 < game.questions.length
                    ? 'Próxima Pergunta'
                    : 'Ver Ranking Final'}
                </Button>
              )}
            </div>

            {showResults && game.mode === 'quiz' && (
              <div className="mt-8">
                <h3 className="font-display text-2xl text-foreground text-center mb-6">
                  Ranking Parcial
                </h3>
                <PlayerList players={ranking.slice(0, 5)} showScores />
              </div>
            )}
          </div>
        )}

        {/* Finished */}
        {isGameFinished && <RankingDisplay players={ranking} />}
      </main>

      {/* Vote Notifications */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex flex-col gap-2 items-center w-full max-w-md px-4">
        {lastVoters.map((voter) => (
          <div 
            key={voter.id} 
            className="bg-card/90 backdrop-blur border border-border px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
             <span className="text-2xl">{voter.avatar}</span>
             <span className="font-medium text-foreground">{voter.name} votou!</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;