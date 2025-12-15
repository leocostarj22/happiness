import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Trophy, Clock, CheckCircle, X } from 'lucide-react';

const Player = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    game,
    currentPlayer,
    joinGame,
    submitVote,
    getCurrentQuestion,
    showResults,
    votes,
  } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const currentQuestion = getCurrentQuestion();

  // Check if player already voted for current question
  const playerVote = currentPlayer && currentQuestion
    ? votes.find(
        (v) =>
          v.playerId === currentPlayer.id && v.questionId === currentQuestion.id
      )
    : null;

  const handleJoin = () => {
    if (!playerName.trim()) return;
    joinGame(playerName);
  };

  const handleVote = () => {
    if (!currentPlayer || selectedOption === null) return;
    submitVote(currentPlayer.id, selectedOption);
    setHasVoted(true);
  };

  // Reset vote state when question changes
  if (currentQuestion && hasVoted && !playerVote) {
    setHasVoted(false);
    setSelectedOption(null);
  }

  // Not connected
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 animate-slide-up">
          <div className="text-center">
            <h1 className="font-display text-5xl gradient-text mb-4">
              Happyness
            </h1>
            <p className="text-muted-foreground text-lg">
              {code ? `Código: ${code}` : 'Entre no jogo'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 card-shadow">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Seu nome
              </label>
              <Input
                placeholder="Como quer ser chamado?"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="h-14 text-lg text-center"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>

            <Button
              variant="gradient"
              size="xl"
              className="w-full"
              onClick={handleJoin}
              disabled={!playerName.trim()}
            >
              <Send className="w-5 h-5" />
              Entrar no Jogo
            </Button>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (!game || game.status === 'waiting') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 animate-slide-up">
          <div className="text-6xl animate-float">{currentPlayer.avatar}</div>
          <div>
            <h2 className="font-display text-3xl text-foreground mb-2">
              Olá, {currentPlayer.name}!
            </h2>
            <p className="text-muted-foreground text-lg">
              Aguardando o jogo começar...
            </p>
          </div>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Game finished
  if (game.status === 'finished') {
    const ranking = [...useGameStore.getState().players].sort(
      (a, b) => b.score - a.score
    );
    const playerRank = ranking.findIndex((p) => p.id === currentPlayer.id) + 1;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-8 animate-slide-up">
          <div className="text-6xl">{currentPlayer.avatar}</div>
          <div>
            <h2 className="font-display text-4xl gradient-text mb-4">
              Fim de Jogo!
            </h2>
            <div className="bg-card border border-border rounded-2xl p-8 card-shadow">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Trophy className="w-12 h-12 text-happiness-yellow" />
                <span className="font-display text-6xl text-primary">
                  {playerRank}º
                </span>
              </div>
              <p className="text-foreground text-xl mb-2">{currentPlayer.name}</p>
              <p className="text-muted-foreground">
                Pontuação: <span className="text-primary font-bold">{currentPlayer.score}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando pergunta...</p>
      </div>
    );
  }

  const colors = [
    'bg-happiness-yellow hover:bg-happiness-yellow/90',
    'bg-happiness-pink hover:bg-happiness-pink/90',
    'bg-happiness-blue hover:bg-happiness-blue/90',
    'bg-happiness-green hover:bg-happiness-green/90',
  ];

  // Already voted
  if (playerVote || hasVoted) {
    const votedOption = playerVote?.optionIndex ?? selectedOption;
    const isCorrect =
      game.mode === 'quiz' && currentQuestion.correctAnswer === votedOption;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 animate-slide-up">
          {showResults ? (
            <>
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
                  isCorrect ? 'bg-happiness-green/20' : 'bg-destructive/20'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle className="w-12 h-12 text-happiness-green" />
                ) : (
                  <X className="w-12 h-12 text-destructive" />
                )}
              </div>
              <h2 className="font-display text-3xl text-foreground">
                {isCorrect ? 'Correto! 🎉' : 'Errou! 😅'}
              </h2>
              {isCorrect && (
                <p className="text-happiness-green font-bold text-xl">+100 pontos</p>
              )}
              <p className="text-muted-foreground">Aguardando próxima pergunta...</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Clock className="w-12 h-12 text-primary animate-pulse" />
              </div>
              <h2 className="font-display text-3xl text-foreground">
                Voto registrado!
              </h2>
              <p className="text-muted-foreground">
                Aguardando outros jogadores...
              </p>
              <div className="bg-card border border-border rounded-xl p-4 inline-block">
                <span className="text-sm text-muted-foreground">Sua resposta:</span>
                <p className="font-semibold text-foreground">
                  {currentQuestion.options[votedOption!]}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Voting
  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      {/* Header */}
      <div className="text-center py-4">
        <span className="text-muted-foreground text-sm">
          Pergunta {game.currentQuestionIndex + 1} de {game.questions.length}
        </span>
        <h2 className="font-display text-2xl text-foreground mt-2">
          {currentQuestion.text}
        </h2>
      </div>

      {/* Options */}
      <div className="flex-1 grid grid-cols-1 gap-4 py-4">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedOption(index)}
            className={`${colors[index % colors.length]} rounded-2xl p-6 text-left transition-all ${
              selectedOption === index
                ? 'ring-4 ring-foreground scale-[1.02]'
                : 'hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-xl bg-background/20 flex items-center justify-center font-display text-2xl text-primary-foreground">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="font-semibold text-lg text-primary-foreground">
                {option}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Submit */}
      <div className="py-4">
        <Button
          variant="gradient"
          size="xl"
          className="w-full"
          onClick={handleVote}
          disabled={selectedOption === null}
        >
          Confirmar Resposta
        </Button>
      </div>
    </div>
  );
};

export default Player;
