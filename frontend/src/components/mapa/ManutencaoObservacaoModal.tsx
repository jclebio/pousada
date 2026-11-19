import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { QuartoMapa } from '../../types';

interface ManutencaoObservacaoModalProps {
  quarto: QuartoMapa;
  modo: 'manutencao' | 'observacao';
  onFechar: () => void;
  onConfirmar: (texto: string) => Promise<void>;
}

export const ManutencaoObservacaoModal: React.FC<ManutencaoObservacaoModalProps> = ({
  quarto,
  modo,
  onFechar,
  onConfirmar
}) => {
  const obrigatorio = modo === 'manutencao' || quarto.status === 'EM_MANUTENCAO';
  const [texto, setTexto] = useState(quarto.observacaoAtual ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (obrigatorio && !texto.trim()) {
      setErro('Informe obrigatoriamente o motivo da manutenção.');
      return;
    }
    try {
      setSalvando(true);
      await onConfirmar(texto.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">
            {modo === 'manutencao'
              ? `Bloquear p/ Manutenção • Quarto ${quarto.numero}`
              : `Observação • Quarto ${quarto.numero}`}
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              {modo === 'manutencao' ? 'Motivo do Reparo (Obrigatório) *' : 'Observação Rápida'}
            </label>
            <textarea
              rows={3}
              required={obrigatorio}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                modo === 'manutencao'
                  ? 'Ex.: Vazamento no registro do banheiro, ar-condicionado sem gelar...'
                  : 'Anote avisos rápidos sobre o quarto (deixe vazio para limpar)...'
              }
              className="w-full rounded-xl border border-slate-300 p-3.5 text-base focus:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
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
              className={`min-h-[48px] flex-[2] rounded-xl px-4 font-bold text-white shadow-md disabled:opacity-60 ${
                modo === 'manutencao' ? 'bg-slate-800' : 'bg-emerald-600'
              }`}
            >
              {salvando
                ? 'Salvando...'
                : modo === 'manutencao'
                  ? 'Colocar em Manutenção'
                  : 'Salvar Observação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
