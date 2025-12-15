import { Question } from '@/types/game';
import { useEffect, useState } from 'react';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  showResults?: boolean;
  voteResults?: { option: string; count: number; percentage: number }[];
  correctAnswer?: number;
}

const QuestionDisplay = ({
  question,
  questionNumber,
  totalQuestions,
  showResults = false,
  voteResults = [],
  correctAnswer,
}: QuestionDisplayProps) => {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit);

  useEffect(() => {
    setTimeLeft(question.timeLimit);
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id, question.timeLimit]);

  const colors = [
    'bg-happiness-yellow',
    'bg-happiness-pink',
    'bg-happiness-blue',
    'bg-happiness-green',
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, index) => {
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
