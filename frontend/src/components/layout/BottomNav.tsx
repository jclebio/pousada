import React from 'react';
import { BarChart3, History, LayoutGrid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AbaAtiva = 'mapa' | 'relatorios' | 'historico';

interface BottomNavProps {
  abaAtiva: AbaAtiva;
  onSelecionarAba: (aba: AbaAtiva) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ abaAtiva, onSelecionarAba }) => {
  const { isGerente } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur pb-safe shadow-[0_-4px_12px_rgba(15,23,42,0.06)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 pt-2">
        <button
          type="button"
          onClick={() => onSelecionarAba('mapa')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition active:scale-95 ${
            abaAtiva === 'mapa'
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span>Mapa</span>
        </button>

        <button
          type="button"
          onClick={() => onSelecionarAba('historico')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition active:scale-95 ${
            abaAtiva === 'historico'
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-5 w-5" />
          <span>Histórico</span>
        </button>

        {isGerente && (
          <button
            type="button"
            onClick={() => onSelecionarAba('relatorios')}
            className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition active:scale-95 ${
              abaAtiva === 'relatorios'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Relatórios</span>
          </button>
        )}
      </div>
    </nav>
  );
};
