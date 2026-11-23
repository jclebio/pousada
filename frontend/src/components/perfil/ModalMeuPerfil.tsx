import React, { useEffect, useState } from 'react';
import {
  Check,
  Edit2,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { PerfilUsuario, UsuarioDetalhes } from '../../types';

interface ModalMeuPerfilProps {
  aberto: boolean;
  onFechar: () => void;
  abaInicial?: 'perfil' | 'usuarios';
}

export const ModalMeuPerfil: React.FC<ModalMeuPerfilProps> = ({ aberto, onFechar, abaInicial }) => {
  const { usuario, isGerente, atualizarUsuarioLocal } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState<'perfil' | 'usuarios'>('perfil');

  // Form Meu Perfil
  const [nome, setNome] = useState(usuario?.nome || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgSucessoPerfil, setMsgSucessoPerfil] = useState<string | null>(null);
  const [erroPerfil, setErroPerfil] = useState<string | null>(null);

  // Gestão de Usuários (Gerente)
  const [usuarios, setUsuarios] = useState<UsuarioDetalhes[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [erroUsuarios, setErroUsuarios] = useState<string | null>(null);

  // Modal / Form de Edição de Usuário por Gerente
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioDetalhes | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editPerfil, setEditPerfil] = useState<PerfilUsuario>('ATENDENTE');
  const [editAtivo, setEditAtivo] = useState(true);
  const [editNovaSenha, setEditNovaSenha] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [msgSucessoEdicao, setMsgSucessoEdicao] = useState<string | null>(null);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  // Form Novo Usuário
  const [mostrandoNovoUsuario, setMostrandoNovoUsuario] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenhaInicial, setNovaSenhaInicial] = useState('');
  const [novoPerfil, setNovoPerfil] = useState<PerfilUsuario>('ATENDENTE');
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  useEffect(() => {
    if (aberto && usuario) {
      setAbaAtiva(abaInicial && isGerente ? abaInicial : 'perfil');
      setNome(usuario.nome);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
      setMsgSucessoPerfil(null);
      setErroPerfil(null);
      setUsuarioEditando(null);
      setMostrandoNovoUsuario(false);
    }
  }, [aberto, usuario, abaInicial, isGerente]);

  const carregarUsuarios = async () => {
    if (!isGerente) return;
    setCarregandoUsuarios(true);
    setErroUsuarios(null);
    try {
      const lista = await api.listarUsuarios();
      setUsuarios(lista);
    } catch (e: unknown) {
      setErroUsuarios(e instanceof Error ? e.message : 'Erro ao carregar lista de usuários.');
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  useEffect(() => {
    if (aberto && isGerente && abaAtiva === 'usuarios') {
      void carregarUsuarios();
    }
  }, [aberto, isGerente, abaAtiva]);

  if (!aberto || !usuario) return null;

  // Salvar meu perfil
  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroPerfil(null);
    setMsgSucessoPerfil(null);

    if (novaSenha && novaSenha.length < 8) {
      setErroPerfil('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (novaSenha && novaSenha !== confirmarNovaSenha) {
      setErroPerfil('A confirmação da nova senha não confere.');
      return;
    }

    if (novaSenha && !senhaAtual) {
      setErroPerfil('Informe sua senha atual para autorizar a alteração de senha.');
      return;
    }

    setSalvandoPerfil(true);
    try {
      const atualizado = await api.atualizarMeuPerfil({
        nome: nome.trim(),
        senhaAtual: senhaAtual || undefined,
        novaSenha: novaSenha || undefined,
      });

      atualizarUsuarioLocal({
        id: atualizado.id,
        nome: atualizado.nome,
        login: atualizado.login,
        perfil: atualizado.perfil,
      });

      setMsgSucessoPerfil('Perfil atualizado com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
      setTimeout(() => setMsgSucessoPerfil(null), 3000);
    } catch (err: unknown) {
      setErroPerfil(err instanceof Error ? err.message : 'Erro ao atualizar perfil.');
    } finally {
      setSalvandoPerfil(false);
    }
  };

  // Abrir edição de um usuário da lista
  const handleIniciarEdicao = (u: UsuarioDetalhes) => {
    setUsuarioEditando(u);
    setEditNome(u.nome);
    setEditPerfil(u.perfil);
    setEditAtivo(u.ativo);
    setEditNovaSenha('');
    setMsgSucessoEdicao(null);
    setErroEdicao(null);
  };

  // Salvar edição feita pelo gerente
  const handleSalvarEdicaoGerente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (editNovaSenha && editNovaSenha.length < 8) {
      setErroEdicao('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao(null);
    try {
      await api.atualizarUsuarioPorGerente(usuarioEditando.id, {
        nome: editNome.trim(),
        perfil: editPerfil,
        ativo: editAtivo,
        novaSenha: editNovaSenha ? editNovaSenha.trim() : undefined,
      });

      setMsgSucessoEdicao('Usuário atualizado com sucesso!');
      await carregarUsuarios();
      setTimeout(() => {
        setUsuarioEditando(null);
        setMsgSucessoEdicao(null);
      }, 1500);
    } catch (err: unknown) {
      setErroEdicao(err instanceof Error ? err.message : 'Erro ao atualizar usuário.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Criar novo usuário pelo gerente
  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenhaInicial.length < 8) {
      setErroCriacao('A senha inicial deve ter no mínimo 8 caracteres.');
      return;
    }

    setCriandoUsuario(true);
    setErroCriacao(null);
    try {
      await api.criarUsuario({
        nome: novoNome.trim(),
        login: novoLogin.trim().toLowerCase(),
        senha: novaSenhaInicial.trim(),
        perfil: novoPerfil,
      });

      setNovoNome('');
      setNovoLogin('');
      setNovaSenhaInicial('');
      setNovoPerfil('ATENDENTE');
      setMostrandoNovoUsuario(false);
      await carregarUsuarios();
    } catch (err: unknown) {
      setErroCriacao(err instanceof Error ? err.message : 'Erro ao criar usuário.');
    } finally {
      setCriandoUsuario(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Perfil e Usuários</h2>
              <p className="text-xs text-slate-400">{usuario.login} • {usuario.perfil}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas (se for Gerente) */}
        {isGerente && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2 shrink-0">
            <button
              type="button"
              onClick={() => setAbaAtiva('perfil')}
              className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-semibold text-xs transition ${
                abaAtiva === 'perfil'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Meus Dados</span>
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('usuarios')}
              className={`flex items-center gap-2 py-2.5 px-3 border-b-2 font-semibold text-xs transition ${
                abaAtiva === 'usuarios'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Gerenciar Equipe</span>
            </button>
          </div>
        )}

        {/* Conteúdo com rolagem */}
        <div className="p-6 overflow-y-auto space-y-6">
          {abaAtiva === 'perfil' ? (
            /* ─── ABA 1: MEUS DADOS ─── */
            <form onSubmit={handleSalvarPerfil} className="space-y-4">
              {msgSucessoPerfil && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{msgSucessoPerfil}</span>
                </div>
              )}

              {erroPerfil && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs">
                  {erroPerfil}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Login (usuário)</label>
                  <input
                    type="text"
                    disabled
                    value={usuario.login}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Perfil de Acesso</label>
                  <div className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-100 flex items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                      {isGerente ? <ShieldCheck className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4 text-emerald-500" />}
                      {usuario.perfil}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção Alterar Senha */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  <span>Alteração de Senha</span>
                  <span className="text-[10px] font-normal text-slate-400">(opcional)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="Necessária apenas se for trocar de senha"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={salvandoPerfil}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {salvandoPerfil && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* ─── ABA 2: GERENCIAR EQUIPE (GERENTE) ─── */
            <div className="space-y-4">
              {/* Botão Novo Usuário */}
              {!mostrandoNovoUsuario && !usuarioEditando && (
                <button
                  type="button"
                  onClick={() => setMostrandoNovoUsuario(true)}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Cadastrar Novo Usuário</span>
                </button>
              )}

              {/* Formulário Novo Usuário */}
              {mostrandoNovoUsuario && (
                <form onSubmit={handleCriarUsuario} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-xs font-bold text-slate-800">Novo Cadastro de Usuário</h3>
                    <button
                      type="button"
                      onClick={() => setMostrandoNovoUsuario(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {erroCriacao && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs">
                      {erroCriacao}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="ex.: Maria Silva"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-medium">Login de Acesso</label>
                      <input
                        type="text"
                        required
                        placeholder="ex.: marias"
                        value={novoLogin}
                        onChange={(e) => setNovoLogin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-medium">Perfil</label>
                      <select
                        value={novoPerfil}
                        onChange={(e) => setNovoPerfil(e.target.value as PerfilUsuario)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="ATENDENTE">ATENDENTE</option>
                        <option value="GERENTE">GERENTE</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Senha Inicial (mínimo 8 caracteres)</label>
                    <input
                      type="password"
                      required
                      placeholder="Defina a senha inicial"
                      value={novaSenhaInicial}
                      onChange={(e) => setNovaSenhaInicial(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMostrandoNovoUsuario(false)}
                      className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={criandoUsuario}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                    >
                      {criandoUsuario && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Cadastrar</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Formulário Edição Usuário pelo Gerente */}
              {usuarioEditando && (
                <form onSubmit={handleSalvarEdicaoGerente} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5">
                      <Edit2 className="h-4 w-4 text-emerald-700" />
                      <h3 className="text-xs font-bold text-slate-800">
                        Editar Usuário: {usuarioEditando.login}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUsuarioEditando(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {msgSucessoEdicao && (
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>{msgSucessoEdicao}</span>
                    </div>
                  )}

                  {erroEdicao && (
                    <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs">
                      {erroEdicao}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-medium">Nome</label>
                    <input
                      type="text"
                      required
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-medium">Perfil</label>
                      <select
                        value={editPerfil}
                        onChange={(e) => setEditPerfil(e.target.value as PerfilUsuario)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="ATENDENTE">ATENDENTE</option>
                        <option value="GERENTE">GERENTE</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-medium">Situação</label>
                      <select
                        value={editAtivo ? 'true' : 'false'}
                        onChange={(e) => setEditAtivo(e.target.value === 'true')}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-emerald-100">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                      <span>Redefinir Senha</span>
                      <span className="text-[10px] text-slate-400 font-normal">(sem exigir senha antiga)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Deixe em branco para não alterar"
                      value={editNovaSenha}
                      onChange={(e) => setEditNovaSenha(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUsuarioEditando(null)}
                      className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={salvandoEdicao}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
                    >
                      {salvandoEdicao && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Salvar Edição</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Usuários */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                  <span>Equipe ({usuarios.length})</span>
                  {carregandoUsuarios && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </div>

                {erroUsuarios && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs">
                    {erroUsuarios}
                  </div>
                )}

                <div className="space-y-2">
                  {usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{u.nome}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.perfil === 'GERENTE'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.perfil}
                          </span>
                          {!u.ativo && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                              INATIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">@{u.login}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIniciarEdicao(u)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
