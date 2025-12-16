import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameMode, Question } from '@/types/game';
import {
  Plus,
  Trash2,
  Play,
  ArrowLeft,
  HelpCircle,
  Vote,
  CheckCircle,
  LogOut,
  RotateCcw,
  List,
  LayoutDashboard,
  Users,
} from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const { token, admin, logout } = useAuthStore();
  const { game, players, createGame, addQuestion, removeQuestion, startGame, loadGame, deleteGame, resetGame, clearGame, openLobby } =
    useGameStore();
  
  // Ensure players is an array to avoid crashes with persistence
  const safePlayers = Array.isArray(players) ? players : [];

  const [myGames, setMyGames] = useState<any[]>([]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    socket.emit('getAdminGames', { token }, (response: any) => {
      if (response.success) {
        setMyGames(response.games);
      }
    });
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [gameName, setGameName] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  // Question form
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState(30);

  const handleCreateGame = () => {
    if (!gameName.trim() || !selectedMode) return;
    createGame(gameName, selectedMode);
  };

  const handleLoadGame = (gameId: string) => {
    loadGame(gameId);
  };

  const handleDeleteGame = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este jogo?')) {
      const success = await deleteGame(gameId);
      if (success) {
        setMyGames(prev => prev.filter(g => g.id !== gameId));
      }
    }
  };

  const handleResetGame = async (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    if(confirm('Reiniciar o jogo? Isso limpará os votos e ranking.')) {
        await resetGame(gameId);
    }
  };

  const handleAddQuestion = () => {
    // Check if game exists
    if (!game || !questionText.trim()) return;
    
    // Use game.mode instead of selectedMode
    if (game.mode === 'voting') {
      const question: Omit<Question, 'id'> = {
        text: questionText,
        options: [], 
        timeLimit,
        usePlayersAsOptions: true,
      };
      addQuestion(question);
      setQuestionText('');
      return;
    }
    
    // Quiz mode logic
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return;

    const question: Omit<Question, 'id'> = {
      text: questionText,
      options: validOptions,
      timeLimit,
      correctAnswer,
    };

    addQuestion(question);
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
  };

  const handleStartGame = () => {
    startGame();
    navigate('/');
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Step 3: Add questions
  if (game) {
    return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 min-h-16 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button variant="ghost" size="icon" onClick={() => clearGame()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 md:flex-none">
              <h1 className="font-display text-xl font-bold truncate max-w-[200px] md:max-w-none">{game.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground text-xs">
                  {game.id}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="text-xs">{game.questions.length} perguntas</span>
                <span className="hidden md:inline">•</span>
                <span className="text-xs">{safePlayers.length} jogadores</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => clearGame()}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Salvar
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/dashboard?gameId=${game.id}`, '_blank')}
              title="Abrir tela do jogo em nova aba"
              className="flex-1 md:flex-none"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dash
            </Button>

            {game.status === 'waiting' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openLobby()}
                className="border-happiness-blue text-happiness-blue hover:bg-happiness-blue hover:text-white flex-1 md:flex-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Lobby
              </Button>
            )}
            
            {game.status === 'lobby' && (
              <Button variant="gradient" size="sm" onClick={handleStartGame} className="flex-1 md:flex-none">
                <Play className="w-4 h-4 mr-2" />
                Iniciar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Question Form */}
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-foreground">
              Nova Pergunta
            </h2>

            <div className="bg-card border border-border rounded-xl p-6 space-y-6 card-shadow">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Pergunta
                </label>
                <Input
                  placeholder={game.mode === 'voting' ? "Ex: Quem é mais provável de..." : "Digite sua pergunta..."}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="h-12"
                />
              </div>

              {game.mode === 'voting' ? (
                <div className="bg-happiness-pink/10 border border-happiness-pink/30 rounded-lg p-4">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Vote className="w-4 h-4 text-happiness-pink" />
                    Os jogadores conectados aparecerão automaticamente como opções de voto
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Opções de Resposta
                  </label>
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-display text-lg ${
                          index === 0
                            ? 'bg-happiness-yellow'
                            : index === 1
                            ? 'bg-happiness-pink'
                            : index === 2
                            ? 'bg-happiness-blue'
                            : 'bg-happiness-green'
                        } text-primary-foreground`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <Input
                        placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant={correctAnswer === index ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setCorrectAnswer(index)}
                        title="Marcar como resposta correta"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tempo limite (segundos)
                </label>
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  min={5}
                  max={120}
                  className="w-32"
                />
              </div>

              <Button
                variant="gradient"
                className="w-full"
                onClick={handleAddQuestion}
                disabled={
                  game.mode === 'voting' 
                    ? !questionText.trim()
                    : !questionText.trim() || options.filter((o) => o.trim()).length < 2
                }
              >
                <Plus className="w-5 h-5" />
                Adicionar Pergunta
              </Button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-foreground">
              Perguntas ({game.questions.length})
            </h2>

            {game.questions.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma pergunta adicionada ainda
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {game.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-card border border-border rounded-xl p-4 animate-scale-in"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground">
                          Pergunta {index + 1}
                        </span>
                        <p className="font-semibold text-foreground mt-1">
                          {question.text}
                        </p>
                        {question.usePlayersAsOptions ? (
                          <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-sm bg-happiness-pink/20 text-happiness-pink border border-happiness-pink">
                            <Vote className="w-3 h-3" />
                            Jogadores como opções
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.options.map((opt, optIndex) => (
                              <span
                                key={optIndex}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  game.mode === 'quiz' &&
                                  question.correctAnswer === optIndex
                                    ? 'bg-happiness-green/20 text-happiness-green border border-happiness-green'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(question.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    );
  }

  // Step 2: Name the game
  if (selectedMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full space-y-8 animate-slide-up">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted mb-4">
              {selectedMode === 'quiz' ? (
                <HelpCircle className="w-5 h-5 text-happiness-blue" />
              ) : (
                <Vote className="w-5 h-5 text-happiness-pink" />
              )}
              <span className="text-foreground">
                {selectedMode === 'quiz' ? 'Quiz' : 'Votação'}
              </span>
            </div>
            <h1 className="font-display text-4xl gradient-text mb-4">
              Nome do Jogo
            </h1>
            <p className="text-muted-foreground">
              Dê um nome para seu jogo
            </p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Ex: Quiz de Filmes, Votação da Galera..."
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              className="h-14 text-lg text-center"
            />
            <Button
              variant="gradient"
              size="xl"
              className="w-full"
              onClick={handleCreateGame}
              disabled={!gameName.trim()}
            >
              Continuar
            </Button>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => setSelectedMode(null)}>
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Select mode
  return (
      <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
             <h2 className="text-xl font-bold truncate">Olá, {admin?.email}</h2>
           </div>
           <div className="flex gap-2 w-full md:w-auto justify-center">
             <Button variant="ghost" onClick={() => navigate('/dashboard')} size="sm">
               <LayoutDashboard className="w-4 h-4 mr-2" />
               Dashboard
             </Button>
             <Button variant="ghost" onClick={handleLogout} size="sm">
               <LogOut className="w-4 h-4 mr-2" />
               Sair
             </Button>
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
          {/* Games List */}
          <div className="md:col-span-1 bg-card rounded-2xl border border-border p-6 h-fit">
            <h3 className="font-display text-xl mb-4 flex items-center gap-2">
              <List className="w-5 h-5" />
              Seus Jogos
            </h3>
            <div className="space-y-3">
              {myGames.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum jogo criado ainda.</p>
              ) : (
                myGames.map((g) => (
                  <div 
                    key={g.id} 
                    onClick={() => handleLoadGame(g.id)}
                    className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                         <span>{g.mode === 'quiz' ? 'Quiz' : 'Votação'}</span>
                         <span>•</span>
                         <span>{new Date(g.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => handleResetGame(e, g.id)}
                        title="Reiniciar Jogo"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteGame(e, g.id)}
                        title="Excluir Jogo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create New Game */}
          <div className="md:col-span-2 space-y-8 animate-slide-up">
            <div className="text-center">
              <h1 className="font-display text-5xl gradient-text mb-4 leading-[1.2]">
                Criar Novo Jogo
              </h1>
              <p className="text-muted-foreground text-lg">
                Escolha o modo de jogo
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => setSelectedMode('voting')}
                className="bg-card border-2 border-border hover:border-happiness-pink rounded-2xl p-8 text-left transition-all hover:scale-105 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-happiness-pink/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Vote className="w-8 h-8 text-happiness-pink" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">
                  Votação
                </h3>
                <p className="text-muted-foreground">
                  Crie enquetes e veja as opiniões do grupo em tempo real. Ideal
                  para decisões coletivas e debates divertidos.
                </p>
              </button>

              <button
                onClick={() => setSelectedMode('quiz')}
                className="bg-card border-2 border-border hover:border-happiness-blue rounded-2xl p-8 text-left transition-all hover:scale-105 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-happiness-blue/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-8 h-8 text-happiness-blue" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">
                  Quiz
                </h3>
                <p className="text-muted-foreground">
                  Teste o conhecimento dos participantes com perguntas e respostas.
                  Pontuação e ranking ao vivo!
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Admin;