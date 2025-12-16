import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, CheckCircle, X, ArrowLeft, Loader2, Clock, LogOut, Trophy } from 'lucide-react';
import { playSuccessSound, playFailureSound } from '@/lib/audio';

const Player = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    game,
    currentPlayer,
    players,
    joinGame,
    leaveGame,
    submitVote,
    getCurrentQuestion,
    showResults,
    votes,
    error,
  } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState(code || '');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Force exit if game is reset or player removed
  useEffect(() => {
    if (currentPlayer) {
      // If game status reverts to waiting (reset), kick player
      if (game && game.status === 'waiting') {
        leaveGame();
        navigate('/play');
        return;
      }

      // If player is no longer in the server list (kicked/reset), kick local
      if (players.length > 0 && !players.find(p => p.id === currentPlayer.id)) {
        leaveGame();
        navigate('/play');
      }
    }
  }, [game, players, currentPlayer, leaveGame, navigate]);

  const currentQuestion = getCurrentQuestion();

  // Sound effects for results
  useEffect(() => {
    if (showResults && (playerVote || hasVoted) && game && currentQuestion && currentPlayer) {
      const votedOption = playerVote?.optionIndex ?? selectedOption;
      let isSuccess = false;

      if (game.mode === 'quiz') {
        isSuccess = currentQuestion.correctAnswer === votedOption;
      } else if (game.mode === 'voting' && currentQuestion.usePlayersAsOptions) {
         const questionVotes = votes.filter(v => v.questionId === currentQuestion.id);
         const voteCounts: Record<string, number> = {};
         questionVotes.forEach(v => {
            const target = v.targetPlayerId || (players[v.optionIndex]?.id);
            if (target) voteCounts[target] = (voteCounts[target] || 0) + 1;
         });
         const myVotes = voteCounts[currentPlayer.id] || 0;
         const maxVotes = Math.max(...Object.values(voteCounts), 0);
         isSuccess = myVotes === maxVotes && maxVotes > 0;
      }

      if (isSuccess) playSuccessSound();
      else playFailureSound();
    }
  }, [showResults, game?.mode]); // Trigger when results are shown

  // Check if player already voted for current question
  const playerVote = currentPlayer && currentQuestion
    ? votes.find(
        (v) =>
          v.playerId === currentPlayer.id && v.questionId === currentQuestion.id
      )
    : null;

  // Sync local state with server state
  useEffect(() => {
    if (playerVote) {
      setHasVoted(true);
    }
  }, [playerVote]);

  const handleJoin = () => {
    if (!playerName.trim() || !gameCode.trim()) return;
    joinGame(gameCode, playerName);
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
              Happiness
            </h1>
            <p className="text-muted-foreground text-lg">
              {code ? `Código: ${code}` : 'Entre no jogo'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 card-shadow">
            {!code && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Código do Jogo
                </label>
                <Input
                  placeholder="Ex: AB12CD"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="h-14 text-lg text-center tracking-widest uppercase"
                />
              </div>
            )}
            
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

            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <Button
              variant="gradient"
              size="xl"
              className="w-full"
              onClick={handleJoin}
              disabled={!playerName.trim() || !gameCode.trim()}
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
  if (!game || game.status === 'waiting' || game.status === 'lobby') {
    return (
      <div className="min-h-screen bg-background flex flex-col p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-2xl gradient-text">Hapiness</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              leaveGame();
              navigate('/');
            }}
          >
            <LogOut className="w-5 h-5 text-destructive" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
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
      </div>
    );
  }

  // Game finished (or out of bounds)
  const isGameFinished = game.status === 'finished' || (game.status === 'playing' && game.currentQuestionIndex >= (game.questions?.length || 0));

  if (isGameFinished) {
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

  // Use players as options if the question is set to do so
  const displayOptions = currentQuestion.usePlayersAsOptions 
    ? players.map(p => `${p.avatar} ${p.name}`)
    : currentQuestion.options;

  // Already voted
  if (playerVote || hasVoted) {
    const votedOption = playerVote?.optionIndex ?? selectedOption;
    
    let isPositive = false;
    let title = '';
    let subtitle = null;

    if (game.mode === 'quiz') {
      isPositive = currentQuestion.correctAnswer === votedOption;
      title = isPositive ? 'Correto! 🎉' : 'Errou! 😅';
      if (isPositive) subtitle = '+100 pontos';
    } else {
      // Voting mode
      if (currentQuestion.usePlayersAsOptions) {
         const questionVotes = votes.filter(v => v.questionId === currentQuestion.id);
         const voteCounts: Record<string, number> = {};
         
         questionVotes.forEach(v => {
            const target = v.targetPlayerId || (players[v.optionIndex]?.id);
            if (target) voteCounts[target] = (voteCounts[target] || 0) + 1;
         });
         
         const myVotes = voteCounts[currentPlayer.id] || 0;
         const maxVotes = Math.max(...Object.values(voteCounts), 0);
         const isWinner = myVotes === maxVotes && maxVotes > 0;
         
         isPositive = isWinner;
         title = isWinner ? 'Está indo muito bem!' : 'Não foi dessa vez!';
         if (isWinner) subtitle = `${myVotes} votos`;
      } else {
         isPositive = true;
         title = 'Voto Registrado!';
      }
    }

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 animate-slide-up">
          {showResults ? (
            <>
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
                  isPositive ? 'bg-happiness-green/20' : 'bg-destructive/20'
                }`}
              >
                {isPositive ? (
                  <CheckCircle className="w-12 h-12 text-happiness-green" />
                ) : (
                  <X className="w-12 h-12 text-destructive" />
                )}
              </div>
              <h2 className="font-display text-3xl text-foreground">
                {title}
              </h2>
              {subtitle && (
                <p className="text-happiness-green font-bold text-xl">{subtitle}</p>
              )}
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
                  {displayOptions[votedOption!]}
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
      <div className={`flex-1 grid gap-4 py-4 ${displayOptions.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {displayOptions.map((option, index) => (
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