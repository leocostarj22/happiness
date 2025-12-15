import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2, Settings, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-happiness-yellow/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-happiness-pink/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-happiness-orange/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="font-display text-7xl md:text-8xl lg:text-9xl gradient-text mb-4 tracking-tight">
            Happyness
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-md mx-auto">
            O jogo perfeito para animar suas festas! 🎉
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="group bg-card border-2 border-border hover:border-primary rounded-3xl p-8 text-center transition-all hover:scale-105 card-shadow"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-happiness-yellow to-happiness-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow">
              <Gamepad2 className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">
              Dashboard
            </h3>
            <p className="text-muted-foreground text-sm">
              Exiba o jogo na tela principal com QR Code para os participantes
            </p>
          </button>

          {/* Admin */}
          <button
            onClick={() => navigate('/admin')}
            className="group bg-card border-2 border-border hover:border-secondary rounded-3xl p-8 text-center transition-all hover:scale-105 card-shadow"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-happiness-pink to-happiness-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Settings className="w-10 h-10 text-secondary-foreground" />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">
              Administrador
            </h3>
            <p className="text-muted-foreground text-sm">
              Crie jogos, adicione perguntas e controle a experiência
            </p>
          </button>

          {/* Player */}
          <button
            onClick={() => navigate('/play')}
            className="group bg-card border-2 border-border hover:border-happiness-blue rounded-3xl p-8 text-center transition-all hover:scale-105 card-shadow"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-happiness-blue to-happiness-green flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">
              Jogador
            </h3>
            <p className="text-muted-foreground text-sm">
              Entre no jogo pelo celular e responda as perguntas
            </p>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-muted-foreground text-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <p>
            Modos disponíveis: <span className="text-happiness-pink">🗳️ Votação</span> e{' '}
            <span className="text-happiness-blue">🎯 Quiz</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
