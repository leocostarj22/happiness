import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
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
} from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const { game, createGame, addQuestion, removeQuestion, startGame } =
    useGameStore();

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

  const handleAddQuestion = () => {
    if (!questionText.trim()) return;
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) return;

    const question: Omit<Question, 'id'> = {
      text: questionText,
      options: validOptions,
      timeLimit,
      ...(selectedMode === 'quiz' ? { correctAnswer } : {}),
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

  // Step 1: Select mode
  if (!selectedMode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8 animate-slide-up">
          <div className="text-center">
            <h1 className="font-display text-5xl gradient-text mb-4">
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

  // Step 2: Name the game
  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
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

  // Step 3: Add questions
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl gradient-text">{game.name}</h1>
              <span className="text-sm text-muted-foreground">
                {game.mode === 'quiz' ? '🎯 Quiz' : '🗳️ Votação'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-muted px-3 py-1 rounded-full text-sm">
              Código: <span className="font-bold text-primary">{game.id}</span>
            </span>
            <Button
              variant="gradient"
              onClick={handleStartGame}
              disabled={game.questions.length === 0}
            >
              <Play className="w-5 h-5" />
              Iniciar ({game.questions.length})
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                  placeholder="Digite sua pergunta..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="h-12"
                />
              </div>

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
                    {game.mode === 'quiz' && (
                      <Button
                        variant={correctAnswer === index ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setCorrectAnswer(index)}
                        title="Marcar como resposta correta"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

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
                  !questionText.trim() ||
                  options.filter((o) => o.trim()).length < 2
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
};

export default Admin;
