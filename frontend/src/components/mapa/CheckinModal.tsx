import React, { useMemo, useState } from 'react';
import { CalendarCheck2, Minus, Plus, X } from 'lucide-react';
import type { CheckinPayload, HospedagemResumoMapa, QuartoMapa } from '../../types';
import {
  formatarDataBR,
  formatarMoeda,
  hojeISO,
  parseValorDecimal,
  somarDiasISO
} from '../../utils/formatters';

interface CheckinModalProps {
  quarto: QuartoMapa;
  reservaPreviaProp?: HospedagemResumoMapa | null;
  onFechar: () => void;
  onConfirmar: (payload: CheckinPayload) => Promise<void>;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  quarto,
  reservaPreviaProp,
  onFechar,
  onConfirmar
}) => {
  const reservaPrevia =
    reservaPreviaProp || (quarto.status === 'RESERVADO' ? quarto.hospedagemAtual : null);

  const [nomeHospede, setNomeHospede] = useState(reservaPrevia?.nomeHospede ?? '');
  const [quantidadePessoas, setQuantidadePessoas] = useState(reservaPrevia?.quantidadePessoas ?? 2);
  const [dataCheckin, setDataCheckin] = useState(reservaPrevia?.dataCheckin ?? hojeISO());
  const [quantidadeDiarias, setQuantidadeDiarias] = useState(reservaPrevia?.quantidadeDiarias ?? 1);

  const sugestaoTotal =
    reservaPrevia?.valorTotal ??
    (quarto.diariaPadrao != null ? quarto.diariaPadrao * (reservaPrevia?.quantidadeDiarias ?? 1) : 0);

  const [pagamentoParcial, setPagamentoParcial] = useState(Boolean(reservaPrevia));
  const [valorPagoCheckinStr, setValorPagoCheckinStr] = useState(
    reservaPrevia
      ? String(Math.max(0, reservaPrevia.valorTotal - reservaPrevia.valorAntecipado))
      : sugestaoTotal > 0
        ? String(sugestaoTotal)
        : ''
  );
  const [valorAntecipadoStr, setValorAntecipadoStr] = useState(
    reservaPrevia ? String(reservaPrevia.valorAntecipado) : '0'
  );
  const [valorTotalStr, setValorTotalStr] = useState(
    sugestaoTotal > 0 ? String(sugestaoTotal) : ''
  );
  const [observacaoQuarto, setObservacaoQuarto] = useState(quarto.observacaoAtual ?? '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const dataSaidaPrevista = useMemo(
    () => somarDiasISO(dataCheckin, quantidadeDiarias),
    [dataCheckin, quantidadeDiarias]
  );

  const atualizarDiarias = (novaQtd: number) => {
    const qtd = Math.max(1, novaQtd);
    setQuantidadeDiarias(qtd);
    if (!reservaPrevia && quarto.diariaPadrao != null) {
      const novoCalc = (quarto.diariaPadrao * qtd).toFixed(2);
      if (!pagamentoParcial) {
        setValorPagoCheckinStr(novoCalc);
      }
      setValorTotalStr(novoCalc);
    }
  };

  const valorPagoNum = parseValorDecimal(valorPagoCheckinStr);
  const valorAntecipadoNum = pagamentoParcial ? parseValorDecimal(valorAntecipadoStr) : 0;
  const valorTotalEfetivo = pagamentoParcial
    ? parseValorDecimal(valorTotalStr)
    : valorPagoNum;
  const saldoRestante = Math.max(0, valorTotalEfetivo - (valorAntecipadoNum + valorPagoNum));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nomeHospede.trim()) {
      setErro('Informe o nome do hóspede.');
      return;
    }

    const payload: CheckinPayload = {
      quartoId: quarto.id,
      reservaId: reservaPrevia?.id,
      nomeHospede: nomeHospede.trim(),
      quantidadePessoas,
      dataCheckin,
      quantidadeDiarias,
      valorPagoCheckin: valorPagoNum,
      observacaoQuarto: observacaoQuarto.trim() || undefined
    };

    if (pagamentoParcial) {
      payload.valorAntecipado = valorAntecipadoNum;
      payload.valorTotal = valorTotalEfetivo;
    }

    try {
      setSalvando(true);
      await onConfirmar(payload);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao realizar check-in.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Check-in • Quarto {quarto.numero}
            </h2>
            <p className="text-xs text-slate-500">
              {quarto.descricao || 'Suíte'}
              {quarto.diariaPadrao != null && ` • Diária sugerida: ${formatarMoeda(quarto.diariaPadrao)}`}
            </p>
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

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Nome do Hóspede *
            </label>
            <input
              type="text"
              required
              value={nomeHospede}
              onChange={(e) => setNomeHospede(e.target.value)}
              placeholder="Ex.: Maria Oliveira"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Pessoas
              </label>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setQuantidadePessoas((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 active:scale-95"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-base font-extrabold">{quantidadePessoas}</span>
                <button
                  type="button"
                  onClick={() => setQuantidadePessoas((p) => p + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Diárias
              </label>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => atualizarDiarias(quantidadeDiarias - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 active:scale-95"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-base font-extrabold">{quantidadeDiarias}</span>
                <button
                  type="button"
                  onClick={() => atualizarDiarias(quantidadeDiarias + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Data de Entrada
            </label>
            <input
              type="date"
              required
              value={dataCheckin}
              onChange={(e) => setDataCheckin(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Banner Automático de Saída Prevista */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CalendarCheck2 className="h-5 w-5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-900">
                Saída prevista automática:
              </span>
            </div>
            <span className="text-base font-extrabold text-emerald-700">
              {formatarDataBR(dataSaidaPrevista)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Valor Pago no Check-in (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              required
              value={valorPagoCheckinStr}
              onChange={(e) => setValorPagoCheckinStr(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-base font-bold focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={pagamentoParcial}
              onChange={(e) => {
                const marcado = e.target.checked;
                setPagamentoParcial(marcado);
                if (marcado && !valorTotalStr) {
                  setValorTotalStr(valorPagoCheckinStr);
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span>Informar Valor Total ou Sinal Antecipado separadamente</span>
          </label>

          {pagamentoParcial && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Sinal Antecipado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={valorAntecipadoStr}
                  onChange={(e) => setValorAntecipadoStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Valor Total (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  required={pagamentoParcial}
                  value={valorTotalStr}
                  onChange={(e) => setValorTotalStr(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-bold"
                />
              </div>
              <div className="col-span-2 flex justify-between text-xs pt-1">
                <span className="text-slate-600">Saldo a receber no check-out:</span>
                <strong className={saldoRestante > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                  {formatarMoeda(saldoRestante)}
                </strong>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Observação rápida (opcional)
            </label>
            <input
              type="text"
              value={observacaoQuarto}
              onChange={(e) => setObservacaoQuarto(e.target.value)}
              placeholder="Ex.: Berço extra, placa do carro..."
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
              className="min-h-[48px] flex-[2] rounded-xl bg-emerald-600 px-4 font-bold text-white shadow-md active:scale-[0.99] disabled:opacity-60"
            >
              {salvando ? 'Confirmando...' : 'Confirmar Check-in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
