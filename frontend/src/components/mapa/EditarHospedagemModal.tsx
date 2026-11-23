import React, { useState } from 'react';
import { AlertCircle, FileEdit, X } from 'lucide-react';
import type { EditarHospedagemPayload, QuartoMapa } from '../../types';
import { parseValorDecimal } from '../../utils/formatters';

interface EditarHospedagemModalProps {
  quarto: QuartoMapa;
  isGerente: boolean;
  onFechar: () => void;
  onConfirmar: (hospedagemId: number, payload: EditarHospedagemPayload) => Promise<void>;
}

export const EditarHospedagemModal: React.FC<EditarHospedagemModalProps> = ({
  quarto,
  isGerente,
  onFechar,
  onConfirmar
}) => {
  const hosp = quarto.hospedagemAtual;

  const [nomeHospede, setNomeHospede] = useState(hosp?.nomeHospede ?? '');
  const [quantidadePessoas, setQuantidadePessoas] = useState(hosp?.quantidadePessoas ?? 1);
  const [valorTotalStr, setValorTotalStr] = useState(hosp?.valorTotal != null ? String(hosp.valorTotal) : '');
  const [valorPagoStr, setValorPagoStr] = useState(hosp?.valorPagoCheckin != null ? String(hosp.valorPagoCheckin) : '');
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!hosp) {
    return null;
  }

  const isFinalizada = hosp.statusHospedagem === 'FINALIZADA';
  const podeEditar = !isFinalizada || isGerente;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditar) {
      setErro('Apenas o Gerente pode editar dados de hospedagem finalizada.');
      return;
    }
    if (!motivo.trim()) {
      setErro('Informe o motivo da alteração para registro de auditoria.');
      return;
    }
    setErro(null);
    try {
      setSalvando(true);
      await onConfirmar(hosp.id, {
        nomeHospede: nomeHospede.trim(),
        quantidadePessoas,
        valorTotal: parseValorDecimal(valorTotalStr),
        valorPagoCheckin: parseValorDecimal(valorPagoStr),
        motivo: motivo.trim()
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao editar hospedagem.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Editar Hospedagem • Quarto {quarto.numero}
              </h2>
              <p className="text-xs text-slate-500">
                Status: <strong className="uppercase">{hosp.statusHospedagem}</strong>
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

        {isFinalizada && !isGerente && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Hospedagem já finalizada. Apenas o perfil GERENTE possui permissão para editar dados pós-checkout.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {erro && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Nome do Hóspede *
            </label>
            <input
              type="text"
              required
              disabled={!podeEditar}
              value={nomeHospede}
              onChange={(e) => setNomeHospede(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Pessoas *
              </label>
              <input
                type="number"
                min="1"
                max={quarto.capacidadeMaxima}
                required
                disabled={!podeEditar}
                value={quantidadePessoas}
                onChange={(e) => setQuantidadePessoas(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                required
                disabled={!podeEditar}
                value={valorTotalStr}
                onChange={(e) => setValorTotalStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Valor Pago no Check-in (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              disabled={!podeEditar}
              value={valorPagoStr}
              onChange={(e) => setValorPagoStr(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Motivo da Alteração (Auditoria) *
            </label>
            <input
              type="text"
              required
              disabled={!podeEditar}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Correção de nome da reserva / ajuste de tarifa..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

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
              disabled={salvando || !podeEditar}
              className="min-h-[48px] flex-[2] rounded-xl bg-slate-900 px-4 font-bold text-white shadow-md active:scale-[0.98] hover:bg-slate-800 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
