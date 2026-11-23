import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  api,
  limparSessao,
  obterTokenSalvo,
  obterUsuarioSalvo,
  salvarSessao
} from '../api/client';
import type { UsuarioResumo } from '../types';

interface AuthContextValue {
  usuario: UsuarioResumo | null;
  carregandoSessao: boolean;
  isGerente: boolean;
  entrar: (login: string, senha: string) => Promise<void>;
  sair: () => void;
  atualizarUsuarioLocal: (novoUsuario: UsuarioResumo) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioResumo | null>(() => obterUsuarioSalvo());
  const [carregandoSessao, setCarregandoSessao] = useState<boolean>(() => Boolean(obterTokenSalvo()));

  useEffect(() => {
    const token = obterTokenSalvo();
    if (!token) {
      setCarregandoSessao(false);
      return;
    }

    api
      .me()
      .then((u) => {
        salvarSessao(token, u);
        setUsuario(u);
      })
      .catch(() => {
        limparSessao();
        setUsuario(null);
      })
      .finally(() => setCarregandoSessao(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUsuario(null);
    window.addEventListener('pousada:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pousada:unauthorized', onUnauthorized);
  }, []);

  const entrar = async (login: string, senha: string) => {
    const resp = await api.login(login, senha);
    salvarSessao(resp.token, resp.usuario);
    setUsuario(resp.usuario);
  };

  const sair = () => {
    limparSessao();
    setUsuario(null);
  };

  const atualizarUsuarioLocal = (novoUsuario: UsuarioResumo) => {
    const token = obterTokenSalvo();
    if (token) {
      salvarSessao(token, novoUsuario);
    }
    setUsuario(novoUsuario);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregandoSessao,
        isGerente: usuario?.perfil === 'GERENTE',
        entrar,
        sair,
        atualizarUsuarioLocal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  }
  return ctx;
}
