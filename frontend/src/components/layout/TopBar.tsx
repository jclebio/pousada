import React from 'react';
import { Hotel, LogOut, MessageSquare, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onRefresh?: () => void;
  atualizando?: boolean;
  temMensagemWhatsapp?: boolean;
  onAbrirMensagemWhatsapp?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRefresh,
  atualizando,
  temMensagemWhatsapp,
  onAbrirMensagemWhatsapp
}) => {
  const { usuario, isGerente, sair } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Hotel className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">Pousada Gestão</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              {isGerente ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <User className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span className="max-w-[130px] truncate">{usuario?.nome}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  isGerente
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {usuario?.perfil}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {temMensagemWhatsapp && onAbrirMensagemWhatsapp && (
            <button
              type="button"
              onClick={onAbrirMensagemWhatsapp}
              aria-label="Reabrir mensagem do WhatsApp"
              title="Reabrir mensagem do WhatsApp da equipe"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900/60 text-emerald-400 border border-emerald-500/40 active:scale-95 hover:bg-emerald-800/80 transition"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Atualizar dados"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-200 active:scale-95 hover:bg-slate-700 transition"
            >
              <RefreshCw className={`h-4 w-4 ${atualizando ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={sair}
            aria-label="Sair do sistema"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-slate-800 px-3 text-xs font-semibold text-rose-300 active:scale-95 hover:bg-slate-700 transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
