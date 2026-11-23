import React, { useMemo, useState } from 'react';
import { CalendarClock, CalendarPlus, Minus, Plus, X } from 'lucide-react';
import type { QuartoMapa, RenovarDiariaPayload } from '../../types';
import {
  formatarDataBR,
  parseValorDecimal,
  somarDiasISO
} from '../../utils/formatters';

interface RenovarDiariaModalProps {
  quarto: QuartoMapa;
  onFechar: () => void;
  onConfirmar: (payload: RenovarDiariaPayload) => Promise<void>;
}

export const RenovarDiariaModal: React.FC<RenovarDiariaModalProps> = ({
  quarto,
  onFechar,
  onConfirmar
}) => {
  const hosp = quarto.hospedagemAtual;
  const [diariasAdicionais, setDiariasAdicionais] = useState(1);
  const diariaPadrao = quarto.diariaPadrao ?? 0;

  const [valorAdicionalStr, setValorAdicionalStr] = useState(
    diariaPadrao > 0 ? diariaPadrao.toFixed(2) : ''
  );
  const [valorPagoAgoraStr, setValorPagoAgoraStr] = useState('0');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const novaDataCheckout = useMemo(() => {
    if (!hosp?.dataCheckoutPrevista) return '';
    return somarDiasISO(hosp.dataCheckoutPrevista, diariasAdicionais);
  }, [hosp?.dataCheckoutPrevista, diariasAdicionais]);

  const atualizarDiarias = (nova: number) => {
    const qtd = Math.max(1, nova);
    setDiariasAdicionais(qtd);
    if (diariaPadrao > 0) {
      setValorAdicionalStr((diariaPadrao * qtd).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    try {
      setSalvando(true);
      await onConfirmar({
        diariasAdicionais,
        valorAdicional: parseValorDecimal(valorAdicionalStr),
        valorPagoAgora: parseValorDecimal(valorPagoAgoraStr),
        observacao: observacao.trim() || undefined
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao renovar diária.');
    } finally {
      setSalvando(false);
    }
  };

  if (!hosp) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <CalendarPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Renovar Diária • Quarto {quarto.numero}
              </h2>
              <p className="text-xs text-slate-500">
                Hóspede: <strong className="text-slate-800">{hosp.nomeHospede}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {erro && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {erro}
            </div>
          )}

          {/* Diárias adicionais */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Diárias Adicionais
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-300 px-3 py-2">
              <button
                type="button"
                onClick={() => atualizarDiarias(diariasAdicionais - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <span className="text-xl font-extrabold text-slate-900">+{diariasAdicionais}</span>
                <span className="text-xs text-slate-500 block">
                  Total: {hosp.quantidadeDiarias + diariasAdicionais} diárias
                </span>
              </div>
              <button
                type="button"
                onClick={() => atualizarDiarias(diariasAdicionais + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Comparativo de Datas */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Saída prevista atual:</span>
              <strong className="text-slate-800">{formatarDataBR(hosp.dataCheckoutPrevista)}</strong>
            </div>
            <div className="flex items-center justify-between text-amber-900 font-bold text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-amber-600" />
                Nova saída prevista:
              </span>
              <span className="text-amber-700">{formatarDataBR(novaDataCheckout)}</span>
            </div>
          </div>

          {/* Valores Financeiros */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Valor Adicional (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                required
                value={valorAdicionalStr}
                onChange={(e) => setValorAdicionalStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Pago Agora (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={valorPagoAgoraStr}
                onChange={(e) => setValorPagoAgoraStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Hóspede solicitou prorrogação..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="min-h-[48px] flex-1 rounded-xl border border-slate-300 px-4 font-bold text-slate-700 active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="min-h-[48px] flex-[2] rounded-xl bg-amber-600 px-4 font-bold text-white shadow-md active:scale-[0.98] hover:bg-amber-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Confirmar Renovação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
