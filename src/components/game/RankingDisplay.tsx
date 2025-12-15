import { Player } from '@/types/game';

interface RankingDisplayProps {
  players: Player[];
}

const RankingDisplay = ({ players }: RankingDisplayProps) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  const podiumColors = [
    'bg-happiness-yellow glow',
    'bg-muted',
    'bg-happiness-orange',
  ];

  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
  const podiumHeights = ['h-32', 'h-44', 'h-24'];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-slide-up">
      <h2 className="font-display text-4xl text-center gradient-text">
        🏆 Ranking Final 🏆
      </h2>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 pt-16">
        {podiumOrder.map((position, displayIndex) => {
          const player = topThree[position];
          if (!player) return null;

          return (
            <div
              key={player.id}
              className="flex flex-col items-center animate-bounce-in"
              style={{ animationDelay: `${displayIndex * 0.2}s` }}
            >
              <div className="text-5xl mb-2">{player.avatar}</div>
              <p className="font-semibold text-foreground text-lg mb-1">
                {player.name}
              </p>
              <p className="font-display text-2xl text-primary mb-4">
                {player.score} pts
              </p>
              <div
                className={`w-24 ${podiumHeights[displayIndex]} ${podiumColors[position]} rounded-t-xl flex items-start justify-center pt-4`}
              >
                <span className="font-display text-3xl text-primary-foreground">
                  {position + 1}º
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 card-shadow">
          <div className="space-y-3">
            {rest.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <span className="font-display text-xl text-muted-foreground w-8">
                  {index + 4}º
                </span>
                <span className="text-2xl">{player.avatar}</span>
                <span className="font-semibold text-foreground flex-1">
                  {player.name}
                </span>
                <span className="font-display text-xl text-primary">
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingDisplay;
