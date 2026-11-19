import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { QuartoMapa } from '../../types';
import { formatarDataBR, formatarMoeda, parseValorDecimal } from '../../utils/formatters';

interface CheckoutModalProps {
  quarto: QuartoMapa;
  onFechar: () => void;
  onConfirmar: (valorPagoCheckout: number, observacaoLimpeza?: string) => Promise<void>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ quarto, onFechar, onConfirmar }) => {
  const hosp = quarto.hospedagemAtual;
  const saldo = hosp?.saldoAReceber ?? 0;

  const [valorPagoStr, setValorPagoStr] = useState(saldo > 0 ? saldo.toFixed(2) : '0');
  const [observacaoLimpeza, setObservacaoLimpeza] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    try {
      setSalvando(true);
      await onConfirmar(
        parseValorDecimal(valorPagoStr),
        observacaoLimpeza.trim() || undefined
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao concluir check-out.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">
            Check-out • Quarto {quarto.numero}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
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

          {hosp && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-sm space-y-1">
              <div className="font-bold text-slate-900">{hosp.nomeHospede}</div>
              <div className="text-xs text-slate-600">
                Entrada: {formatarDataBR(hosp.dataCheckin)} • Saída prevista:{' '}
                {formatarDataBR(hosp.dataCheckoutPrevista)}
              </div>
              <div className="flex justify-between pt-1 text-xs">
                <span>Total da hospedagem:</span>
                <strong>{formatarMoeda(hosp.valorTotal)}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span>Saldo pendente atual:</span>
                <strong className={saldo > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  {formatarMoeda(saldo)}
                </strong>
              </div>
            </div>
          )}

          {saldo > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Valor Recebido na Saída (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={saldo}
                inputMode="decimal"
                value={valorPagoStr}
                onChange={(e) => setValorPagoStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base font-bold"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Observação para a Limpeza (opcional)
            </label>
            <input
              type="text"
              value={observacaoLimpeza}
              onChange={(e) => setObservacaoLimpeza(e.target.value)}
              placeholder="Ex.: Trocar enxoval completo, frigobar usado..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="min-h-[48px] flex-1 rounded-xl border border-slate-300 px-4 font-bold text-slate-700"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="min-h-[48px] flex-[2] rounded-xl bg-rose-600 px-4 font-bold text-white shadow-md disabled:opacity-60"
            >
              {salvando ? 'Finalizando...' : 'Confirmar Saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
