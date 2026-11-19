import React, { useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';
import type { QuartoMapa } from '../../types';

interface EstornoModalProps {
  quarto: QuartoMapa;
  onFechar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}

export const EstornoModal: React.FC<EstornoModalProps> = ({ quarto, onFechar, onConfirmar }) => {
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!motivo.trim()) {
      setErro('Informe o motivo do estorno para auditoria.');
      return;
    }
    try {
      setSalvando(true);
      await onConfirmar(motivo.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao estornar check-in.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertOctagon className="h-5 w-5" />
            <h2 className="text-lg font-extrabold">Estornar Check-in • Quarto {quarto.numero}</h2>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Esta ação é exclusiva do <strong>GERENTE</strong>. A hospedagem de{' '}
            <strong>{quarto.hospedagemAtual?.nomeHospede}</strong> será marcada como{' '}
            <strong>ESTORNADA</strong> (ignorada nos relatórios financeiros) e o quarto voltará
            imediatamente para <strong>DISPONÍVEL</strong>.
          </p>

          {erro && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Motivo do Estorno *
            </label>
            <input
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Check-in lançado no quarto errado"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="min-h-[48px] flex-1 rounded-xl border border-slate-300 px-4 font-bold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="min-h-[48px] flex-[2] rounded-xl bg-rose-700 px-4 font-bold text-white shadow-md disabled:opacity-60"
            >
              {salvando ? 'Estornando...' : 'Confirmar Estorno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
