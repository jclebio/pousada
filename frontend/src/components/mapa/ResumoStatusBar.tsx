import React from 'react';
import type { QuartoMapa, StatusQuarto } from '../../types';

export type FiltroStatusMapa = 'TODOS' | StatusQuarto;

interface ResumoStatusBarProps {
  quartos: QuartoMapa[];
  totalReservas?: number;
  filtroAtual: FiltroStatusMapa;
  onAlterarFiltro: (novo: FiltroStatusMapa) => void;
}

export const ResumoStatusBar: React.FC<ResumoStatusBarProps> = ({
  quartos,
  totalReservas,
  filtroAtual,
  onAlterarFiltro
}) => {
  const ativos = quartos.filter((q) => q.ativo);
  const contar = (st: StatusQuarto) => ativos.filter((q) => q.status === st).length;

  const itens: { chave: FiltroStatusMapa; label: string; count: number; badgeClass: string }[] = [
    { chave: 'TODOS', label: 'Todos', count: ativos.length, badgeClass: 'bg-slate-800 text-white' },
    {
      chave: 'DISPONIVEL',
      label: 'Livres',
      count: contar('DISPONIVEL'),
      badgeClass: 'bg-emerald-600 text-white'
    },
    {
      chave: 'OCUPADO',
      label: 'Ocupados',
      count: contar('OCUPADO'),
      badgeClass: 'bg-rose-600 text-white'
    },
    {
      chave: 'RESERVADO',
      label: 'Reservados',
      count: totalReservas !== undefined ? totalReservas : contar('RESERVADO'),
      badgeClass: 'bg-sky-600 text-white'
    },
    {
      chave: 'AGUARDANDO_LIMPEZA',
      label: 'Ag. Limpeza',
      count: contar('AGUARDANDO_LIMPEZA'),
      badgeClass: 'bg-amber-500 text-white'
    },
    {
      chave: 'EM_LIMPEZA',
      label: 'Limpando',
      count: contar('EM_LIMPEZA'),
      badgeClass: 'bg-purple-600 text-white'
    },
    {
      chave: 'EM_MANUTENCAO',
      label: 'Manutenção',
      count: contar('EM_MANUTENCAO'),
      badgeClass: 'bg-slate-600 text-white'
    }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {itens.map((item) => {
        const selecionado = filtroAtual === item.chave;
        return (
          <button
            key={item.chave}
            type="button"
            onClick={() => onAlterarFiltro(item.chave)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              selecionado
                ? `${item.badgeClass} border-transparent shadow-sm`
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span>{item.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                selecionado ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
