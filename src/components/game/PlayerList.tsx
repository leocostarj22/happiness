import { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  showScores?: boolean;
}

const PlayerList = ({ players, showScores = false }: PlayerListProps) => {
  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-lg">
          Aguardando jogadores...
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {players.map((player, index) => (
        <div
          key={player.id}
          className="bg-card border border-border rounded-xl p-4 text-center animate-scale-in card-shadow"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="text-4xl mb-2">{player.avatar}</div>
          <p className="font-semibold text-foreground truncate">{player.name}</p>
          {showScores && (
            <p className="text-primary font-display text-xl mt-1">
              {player.score}
            </p>
          )}
          {player.connected && (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="w-2 h-2 rounded-full bg-happiness-green" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
