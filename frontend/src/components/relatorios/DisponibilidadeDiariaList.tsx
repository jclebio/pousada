import React from 'react';
import type { DisponibilidadeDiaria } from '../../types';
import { formatarDataBR, formatarDiaSemanaCurto } from '../../utils/formatters';

interface DisponibilidadeDiariaListProps {
  dias: DisponibilidadeDiaria[];
}

export const DisponibilidadeDiariaList: React.FC<DisponibilidadeDiariaListProps> = ({ dias }) => {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-3">
      <div>
        <h3 className="text-sm font-extrabold text-slate-900">Lista Diária de Quartos Vagos</h3>
        <p className="text-xs text-slate-500">Disponibilidade por pernoite no intervalo consultado</p>
      </div>

      <div className="divide-y divide-slate-100">
        {dias.map((dia) => (
          <div
            key={dia.data}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 w-12">
                {formatarDataBR(dia.data, true)}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                {formatarDiaSemanaCurto(dia.data)}
              </span>
              <span className="text-[11px] text-slate-500">
                ({dia.totalVagos}/{dia.totalQuartosElegiveis} livres)
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {dia.totalQuartosElegiveis === 0 ? (
                <span className="text-[11px] text-slate-400">Sem quartos criados na data</span>
              ) : dia.quartosVagos.length === 0 ? (
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                  100% Ocupado
                </span>
              ) : (
                dia.quartosVagos.map((num) => (
                  <span
                    key={num}
                    className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800"
                  >
                    {num}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
