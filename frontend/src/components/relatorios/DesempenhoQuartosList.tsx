import React from 'react';
import type { DesempenhoQuarto } from '../../types';
import { formatarMoeda } from '../../utils/formatters';

interface DesempenhoQuartosListProps {
  itens: DesempenhoQuarto[];
}

export const DesempenhoQuartosList: React.FC<DesempenhoQuartosListProps> = ({ itens }) => {
  const maiorReceita = Math.max(1, ...itens.map((i) => i.faturamentoTotal));

  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-slate-900">
          Comparativo por Quarto (Vacância vs. Receita)
        </h3>
        <p className="text-xs text-slate-500">
          Desempenho individual respeitando a data de criação de cada unidade
        </p>
      </div>

      <div className="space-y-4">
        {itens.map((q) => {
          const larguraReceita = Math.round((q.faturamentoTotal / maiorReceita) * 100);
          return (
            <div
              key={q.quartoId}
              className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-sm text-slate-900">
                    Quarto {q.numeroQuarto}
                  </span>
                  {q.descricao && (
                    <span className="ml-1.5 text-xs text-slate-500">• {q.descricao}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {formatarMoeda(q.faturamentoTotal)}
                </span>
              </div>

              {/* Barra 1: Vacância / Ocupação */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>
                    Vacância: <strong className="text-amber-700">{q.taxaVacanciaPercentual.toFixed(1)}%</strong> ({q.diariasVagas} livres / {q.diariasDisponiveis} disp.)
                  </span>
                  <span>Ocup.: {q.taxaOcupacaoPercentual.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200 flex">
                  <div
                    style={{ width: `${Math.min(100, q.taxaVacanciaPercentual)}%` }}
                    className="bg-amber-500"
                  />
                </div>
              </div>

              {/* Barra 2: Receita Comparativa */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Recebido: {formatarMoeda(q.faturamentoRecebido)}</span>
                  {q.faturamentoAReceber > 0 && (
                    <span className="text-amber-700 font-semibold">
                      A receber: {formatarMoeda(q.faturamentoAReceber)}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    style={{ width: `${larguraReceita}%` }}
                    className="h-full rounded-full bg-emerald-600"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
