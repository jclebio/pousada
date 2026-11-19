import React, { useState } from 'react';
import { Eye, EyeOff, Hotel, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { entrar } = useAuth();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    try {
      setCarregando(true);
      await entrar(login, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-900 px-5 py-8">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-inner">
            <Hotel className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Pousada Gestão</h1>
          <p className="text-sm text-slate-400">
            Mapa operacional de quartos, vacância e faturamento
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-2xl space-y-4"
        >
          {erro && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
              Login
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ex.: gerente ou atendente1"
                className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-3 text-base focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 pl-11 pr-12 py-3 text-base focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center text-slate-500"
              >
                {mostrarSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="min-h-[50px] w-full rounded-xl bg-emerald-600 font-bold text-white text-base shadow-md active:scale-[0.99] hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};
