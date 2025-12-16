import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = isLogin 
      ? await login(email, password)
      : await register(email, password);

    if (success) {
      navigate('/admin');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        <div className="text-center">
          <h1 className="font-display text-4xl gradient-text mb-2">
            Admin Access
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Entre para gerenciar seus jogos' : 'Crie uma conta para começar'}
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              variant="gradient"
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;