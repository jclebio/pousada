import React, { useMemo, useState } from 'react';
import { CalendarClock, Minus, Plus, X } from 'lucide-react';
import type { QuartoMapa, ReservaPayload } from '../../types';
import {
  formatarDataBR,
  hojeISO,
  parseValorDecimal,
  somarDiasISO
} from '../../utils/formatters';

interface ReservaModalProps {
  /** Quando fornecido, pré-seleciona o quarto (vindo do card). Quando null/undefined, o usuário escolhe. */
  quarto?: QuartoMapa | null;
  /** Lista de todos os quartos ativos — usada para o select quando quarto não está pré-selecionado. */
  quartosDisponiveis?: QuartoMapa[];
  onFechar: () => void;
  onConfirmar: (payload: ReservaPayload) => Promise<void>;
}

export const ReservaModal: React.FC<ReservaModalProps> = ({
  quarto: quartoProp,
  quartosDisponiveis = [],
  onFechar,
  onConfirmar
}) => {
  // Quando aberto globalmente (sem quarto pré-selecionado), o usuário escolhe via select
  const [quartoIdSelecionado, setQuartoIdSelecionado] = useState<number | ''>(
    quartoProp ? quartoProp.id : ''
  );

  const quartoEfetivo = useMemo(() => {
    if (quartoProp) return quartoProp;
    if (quartoIdSelecionado === '') return null;
    return quartosDisponiveis.find((q) => q.id === quartoIdSelecionado) ?? null;
  }, [quartoProp, quartoIdSelecionado, quartosDisponiveis]);

  const [nomeHospede, setNomeHospede] = useState('');
  const [quantidadePessoas, setQuantidadePessoas] = useState(2);
  const [dataCheckin, setDataCheckin] = useState(hojeISO());
  const [quantidadeDiarias, setQuantidadeDiarias] = useState(2);
  const [valorTotalStr, setValorTotalStr] = useState(
    quartoEfetivo?.diariaPadrao != null
      ? String((quartoEfetivo.diariaPadrao * 2).toFixed(2))
      : ''
  );
  const [valorAntecipadoStr, setValorAntecipadoStr] = useState('0');
  const [observacaoQuarto, setObservacaoQuarto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const dataSaida = useMemo(
    () => somarDiasISO(dataCheckin, quantidadeDiarias),
    [dataCheckin, quantidadeDiarias]
  );

  const atualizarDiarias = (nova: number) => {
    const d = Math.max(1, nova);
    setQuantidadeDiarias(d);
    const diaria = quartoEfetivo?.diariaPadrao ?? null;
    if (diaria != null) {
      setValorTotalStr((diaria * d).toFixed(2));
    }
  };

  // Quando o usuário troca o quarto no select, recalcula o valor sugerido
  const handleTrocarQuarto = (id: number | '') => {
    setQuartoIdSelecionado(id);
    if (id !== '') {
      const q = quartosDisponiveis.find((x) => x.id === id);
      if (q?.diariaPadrao != null) {
        setValorTotalStr((q.diariaPadrao * quantidadeDiarias).toFixed(2));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!quartoEfetivo) {
      setErro('Selecione um quarto para a reserva.');
      return;
    }
    try {
      setSalvando(true);
      await onConfirmar({
        quartoId: quartoEfetivo.id,
        nomeHospede: nomeHospede.trim(),
        quantidadePessoas,
        dataCheckin,
        quantidadeDiarias,
        valorTotal: parseValorDecimal(valorTotalStr),
        valorAntecipado: parseValorDecimal(valorAntecipadoStr),
        observacaoQuarto: observacaoQuarto.trim() || undefined
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao registrar reserva.');
    } finally {
      setSalvando(false);
    }
  };

  const tituloQuarto = quartoEfetivo ? `Quarto ${quartoEfetivo.numero}` : 'Escolha o Quarto';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Reservar • {tituloQuarto}
            </h2>
            <p className="text-xs text-slate-500">Agenda uma chegada futura</p>
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
          {erro && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              {erro}
            </div>
          )}

          {/* Select de quarto — só aparece quando não há quarto pré-selecionado */}
          {!quartoProp && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Quarto *
              </label>
              <select
                required
                value={quartoIdSelecionado}
                onChange={(e) =>
                  handleTrocarQuarto(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base bg-white"
              >
                <option value="">Selecione um quarto...</option>
                {quartosDisponiveis.map((q) => (
                  <option key={q.id} value={q.id}>
                    Quarto {q.numero}
                    {q.descricao ? ` — ${q.descricao}` : ''}
                    {q.diariaPadrao != null ? ` (R$ ${q.diariaPadrao}/noite)` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Nome do Hóspede *
            </label>
            <input
              type="text"
              required
              value={nomeHospede}
              onChange={(e) => setNomeHospede(e.target.value)}
              placeholder="Ex.: João Pereira"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Pessoas</label>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setQuantidadePessoas((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-base font-extrabold">{quantidadePessoas}</span>
                <button
                  type="button"
                  onClick={() => setQuantidadePessoas((p) => p + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Diárias</label>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => atualizarDiarias(quantidadeDiarias - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-base font-extrabold">{quantidadeDiarias}</span>
                <button
                  type="button"
                  onClick={() => atualizarDiarias(quantidadeDiarias + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Data Prevista de Chegada
            </label>
            <input
              type="date"
              required
              value={dataCheckin}
              onChange={(e) => setDataCheckin(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-sky-50 border border-sky-200 px-4 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold text-sky-900">
              <CalendarClock className="h-4 w-4 text-sky-600" />
              Saída prevista:
            </span>
            <strong className="text-sm font-extrabold text-sky-700">
              {formatarDataBR(dataSaida)}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                value={valorTotalStr}
                onChange={(e) => setValorTotalStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Sinal Pago (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={valorAntecipadoStr}
                onChange={(e) => setValorAntecipadoStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={observacaoQuarto}
              onChange={(e) => setObservacaoQuarto(e.target.value)}
              placeholder="Ex.: Chega às 20h, pacote casal..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-base"
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
              className="min-h-[48px] flex-[2] rounded-xl bg-sky-600 px-4 font-bold text-white shadow-md disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
