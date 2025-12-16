import { Question, Player } from '@/types/game';
import { useEffect, useState } from 'react';
import { playCountdownBeep, playTimeUpSound } from '@/lib/audio';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  showResults?: boolean;
  voteResults?: { option: string; count: number; percentage: number }[];
  correctAnswer?: number;
  players?: Player[]; // For voting mode - players as options
}

const QuestionDisplay = ({
  question,
  questionNumber,
  totalQuestions,
  showResults = false,
  voteResults = [],
  correctAnswer,
  players = [],
}: QuestionDisplayProps) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);

  useEffect(() => {
    setTimeLeft(question.timeLimit);
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id, question.timeLimit]);

  // Sound effects
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      playCountdownBeep();
    } else if (timeLeft === 0) {
      playTimeUpSound();
    }
  }, [timeLeft]);

  const colors = [
    'bg-happiness-yellow',
    'bg-happiness-pink',
    'bg-happiness-blue',
    'bg-happiness-green',
  ];

  // Use players as options if the question is set to do so
  const displayOptions = question.usePlayersAsOptions 
    ? players.map(p => `${p.avatar} ${p.name}`)
    : question.options;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-medium">
          Pergunta {questionNumber} de {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center font-display text-2xl ${
              timeLeft <= 5 ? 'bg-destructive animate-pulse' : 'bg-primary'
            } text-primary-foreground`}
          >
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center card-shadow">
        <h2 className="font-display text-3xl md:text-4xl text-foreground">
          {question.text}
        </h2>
      </div>

      {/* Options */}
      <div className={`grid gap-4 ${displayOptions.length <= 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
        {displayOptions.map((option, index) => {
          const result = voteResults[index];
          const isCorrect = correctAnswer === index;

          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-xl p-6 transition-all duration-500 ${
                colors[index % colors.length]
              } ${showResults && isCorrect ? 'ring-4 ring-foreground animate-pulse-glow' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-background/20 flex items-center justify-center font-display text-xl text-primary-foreground">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-semibold text-lg text-primary-foreground flex-1">
                  {option}
                </span>
              </div>

              {showResults && result && (
                <>
                  <div
                    className="absolute inset-0 bg-background/30 transition-all duration-1000"
                    style={{ width: `${result.percentage}%` }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-display text-2xl text-primary-foreground">
                    {result.count} ({Math.round(result.percentage)}%)
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionDisplay;