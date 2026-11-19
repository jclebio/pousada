import React from 'react';
import { Banknote, BedDouble, TrendingUp } from 'lucide-react';
import type { RelatorioVacancia } from '../../types';
import { formatarDataBR, formatarMoeda } from '../../utils/formatters';

interface CardsResumoFinanceiroProps {
  relatorio: RelatorioVacancia;
}

export const CardsResumoFinanceiro: React.FC<CardsResumoFinanceiroProps> = ({ relatorio }) => {
  const percRecebido =
    relatorio.faturamentoTotal > 0
      ? Math.min(100, Math.round((relatorio.faturamentoRecebido / relatorio.faturamentoTotal) * 100))
      : 0;

  return (
    <div className="space-y-3">
      {/* Card Principal de Faturamento Somado (Recebido vs. A Receber) */}
      <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-md space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Faturamento Somado no Período
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {formatarMoeda(relatorio.faturamentoTotal)}
            </p>
            <p className="text-[11px] text-slate-400">
              {formatarDataBR(relatorio.dataInicio)} até {formatarDataBR(relatorio.dataFim)} (
              {relatorio.quantidadeDiasPeriodo} dia(s))
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Banknote className="h-5 w-5" />
          </div>
        </div>

        {/* Barra proporcional Recebido vs A Receber */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700 flex">
          <div
            style={{ width: `${percRecebido}%` }}
            className="bg-emerald-400 transition-all"
          />
          {relatorio.faturamentoAReceber > 0 && (
            <div
              style={{ width: `${100 - percRecebido}%` }}
              className="bg-amber-400 transition-all"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl bg-slate-800/90 p-2.5 border border-emerald-500/30">
            <span className="block text-[11px] font-semibold text-emerald-300">Recebido</span>
            <strong className="text-sm font-bold text-white">
              {formatarMoeda(relatorio.faturamentoRecebido)}
            </strong>
          </div>
          <div className="rounded-xl bg-slate-800/90 p-2.5 border border-amber-500/30">
            <span className="block text-[11px] font-semibold text-amber-300">A Receber</span>
            <strong className="text-sm font-bold text-white">
              {formatarMoeda(relatorio.faturamentoAReceber)}
            </strong>
          </div>
        </div>
      </div>

      {/* Cards Secundários: Diária Média + Taxa de Vacância */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Diária Média</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {formatarMoeda(relatorio.diariaMedia)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Em {relatorio.totalDiariasOcupadas} pernoite(s) ocupado(s)
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Taxa de Vacância</span>
            <BedDouble className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-xl font-extrabold text-slate-900">
            {relatorio.taxaVacanciaPercentual.toFixed(1)}%
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {relatorio.totalDiariasVagas} vagas de {relatorio.totalDiariasDisponiveis} disp. (Ocup.{' '}
            {relatorio.taxaOcupacaoPercentual.toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  );
};
