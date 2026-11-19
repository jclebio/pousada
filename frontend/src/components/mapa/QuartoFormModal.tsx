import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { QuartoMapa, QuartoRequest } from '../../types';
import { hojeISO, parseValorDecimal } from '../../utils/formatters';

interface QuartoFormModalProps {
  quartoExistente?: QuartoMapa | null;
  onFechar: () => void;
  onSalvar: (payload: QuartoRequest) => Promise<void>;
}

export const QuartoFormModal: React.FC<QuartoFormModalProps> = ({
  quartoExistente,
  onFechar,
  onSalvar
}) => {
  const editando = Boolean(quartoExistente);

  const [numero, setNumero] = useState(quartoExistente?.numero ?? '');
  const [descricao, setDescricao] = useState(quartoExistente?.descricao ?? '');
  const [capacidadeMaxima, setCapacidadeMaxima] = useState(
    quartoExistente?.capacidadeMaxima ?? 2
  );
  const [diariaPadraoStr, setDiariaPadraoStr] = useState(
    quartoExistente?.diariaPadrao != null ? String(quartoExistente.diariaPadrao) : ''
  );
  const [dataCriacao, setDataCriacao] = useState(quartoExistente?.dataCriacao ?? hojeISO());
  const [ativo, setAtivo] = useState(quartoExistente?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!numero.trim()) {
      setErro('Informe o número/identificador do quarto.');
      return;
    }

    try {
      setSalvando(true);
      await onSalvar({
        numero: numero.trim(),
        descricao: descricao.trim() || null,
        capacidadeMaxima: Math.max(1, capacidadeMaxima),
        diariaPadrao: diariaPadraoStr.trim() ? parseValorDecimal(diariaPadraoStr) : null,
        ativo,
        dataCriacao
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar quarto.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">
            {editando ? `Editar Quarto ${quartoExistente?.numero}` : 'Novo Quarto'}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Número *
              </label>
              <input
                type="text"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex.: 06"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Capacidade *
              </label>
              <input
                type="number"
                min={1}
                required
                value={capacidadeMaxima}
                onChange={(e) => setCapacidadeMaxima(Number(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Suíte Casal Superior"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Diária Padrão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={diariaPadraoStr}
                onChange={(e) => setDiariaPadraoStr(e.target.value)}
                placeholder="200,00"
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Data de Criação
              </label>
              <input
                type="date"
                required
                value={dataCriacao}
                onChange={(e) => setDataCriacao(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base"
              />
            </div>
          </div>

          <label className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-sm font-semibold text-slate-700">
            <span>Quarto ativo para operação e relatórios</span>
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600"
            />
          </label>

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
              className="min-h-[48px] flex-[2] rounded-xl bg-slate-900 px-4 font-bold text-white shadow-md disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Quarto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
