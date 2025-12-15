import { useGameStore } from '@/stores/gameStore';
import { useNavigate } from 'react-router-dom';
import QRCodeDisplay from '@/components/game/QRCodeDisplay';
import PlayerList from '@/components/game/PlayerList';
import QuestionDisplay from '@/components/game/QuestionDisplay';
import RankingDisplay from '@/components/game/RankingDisplay';
import { Button } from '@/components/ui/button';
import { Play, SkipForward, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
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

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 animate-slide-up">
          <h1 className="font-display text-6xl gradient-text">Happyness</h1>
          <p className="text-muted-foreground text-xl">
            Nenhum jogo ativo no momento
          </p>
          <Button
            variant="gradient"
            size="xl"
            onClick={() => navigate('/admin')}
          >
            Criar Novo Jogo
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const voteResults = getVoteResults();
  const ranking = getPlayerRanking();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl gradient-text">Happyness</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              {game.mode === 'quiz' ? '🎯 Quiz' : '🗳️ Votação'}
            </span>
            <span className="font-display text-lg text-primary">
              {game.name}
            </span>
            <span className="bg-muted px-3 py-1 rounded-full text-sm">
              {players.length} jogadores
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Waiting for players */}
        {game.status === 'waiting' && (
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
              {game.questions.length > 0 && (
                <div className="flex justify-center lg:justify-start">
                  <Button
                    variant="game"
                    onClick={startGame}
                    className="animate-pulse-glow"
                  >
                    <Play className="w-6 h-6" />
                    Iniciar Jogo ({game.questions.length} perguntas)
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <h3 className="font-display text-2xl text-foreground">
                Jogadores Conectados
              </h3>
              <PlayerList players={players} />
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
        {game.status === 'finished' && <RankingDisplay players={ranking} />}
      </main>
    </div>
  );
};

export default Dashboard;
