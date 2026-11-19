import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  LogIn,
  LogOut,
  MessageSquarePlus,
  Pencil,
  RotateCcw,
  Sparkles,
  Users,
  Wrench
} from 'lucide-react';
import type { HospedagemResumoMapa, QuartoMapa, StatusQuarto } from '../../types';
import { formatarDataBR, formatarMoeda } from '../../utils/formatters';

interface QuartoCardProps {
  quarto: QuartoMapa;
  isGerente: boolean;
  onAbrirCheckin: (quarto: QuartoMapa, reserva?: HospedagemResumoMapa | null) => void;
  onAbrirReserva: (quarto: QuartoMapa) => void;
  onAbrirCheckout: (quarto: QuartoMapa) => void;
  onAbrirManutencao: (quarto: QuartoMapa) => void;
  onAbrirObservacao: (quarto: QuartoMapa) => void;
  onAbrirEstorno: (quarto: QuartoMapa) => void;
  onAbrirEdicaoQuarto: (quarto: QuartoMapa) => void;
  onAlterarStatusDireto: (quarto: QuartoMapa, novoStatus: StatusQuarto) => void;
  onCancelarReserva?: (reservaId: number) => void;
}

const ESTILOS_STATUS: Record<
  StatusQuarto,
  {
    rotulo: string;
    cardBg: string;
    border: string;
    badge: string;
    barraTopo: string;
  }
> = {
  DISPONIVEL: {
    rotulo: 'Disponível',
    cardBg: 'bg-emerald-50/70',
    border: 'border-emerald-300',
    badge: 'bg-emerald-600 text-white',
    barraTopo: 'bg-emerald-500'
  },
  RESERVADO: {
    rotulo: 'Reservado',
    cardBg: 'bg-sky-50/70',
    border: 'border-sky-300',
    badge: 'bg-sky-600 text-white',
    barraTopo: 'bg-sky-500'
  },
  OCUPADO: {
    rotulo: 'Ocupado',
    cardBg: 'bg-rose-50/70',
    border: 'border-rose-300',
    badge: 'bg-rose-600 text-white',
    barraTopo: 'bg-rose-500'
  },
  AGUARDANDO_LIMPEZA: {
    rotulo: 'Aguardando Limpeza',
    cardBg: 'bg-amber-50/80',
    border: 'border-amber-300',
    badge: 'bg-amber-500 text-white',
    barraTopo: 'bg-amber-500'
  },
  EM_LIMPEZA: {
    rotulo: 'Em Limpeza',
    cardBg: 'bg-purple-50/70',
    border: 'border-purple-300',
    badge: 'bg-purple-600 text-white',
    barraTopo: 'bg-purple-500'
  },
  EM_MANUTENCAO: {
    rotulo: 'Em Manutenção',
    cardBg: 'bg-slate-100',
    border: 'border-slate-400',
    badge: 'bg-slate-700 text-white',
    barraTopo: 'bg-slate-600'
  }
};

export const QuartoCard: React.FC<QuartoCardProps> = ({
  quarto,
  isGerente,
  onAbrirCheckin,
  onAbrirReserva,
  onAbrirCheckout,
  onAbrirManutencao,
  onAbrirObservacao,
  onAbrirEstorno,
  onAbrirEdicaoQuarto,
  onAlterarStatusDireto,
  onCancelarReserva
}) => {
  const estilo = ESTILOS_STATUS[quarto.status];
  const hosp = quarto.hospedagemAtual;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 shadow-sm transition ${
        quarto.ativo ? `${estilo.cardBg} ${estilo.border}` : 'bg-slate-100 border-dashed border-slate-300 opacity-75'
      }`}
    >
      <div className={`h-1.5 w-full ${quarto.ativo ? estilo.barraTopo : 'bg-slate-400'}`} />

      <div className="p-4 space-y-3">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-slate-900">Quarto {quarto.numero}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${estilo.badge}`}>
                {quarto.ativo ? estilo.rotulo : 'Inativo'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {quarto.descricao || 'Suíte padrão'} • Até {quarto.capacidadeMaxima} pessoa(s)
              {quarto.diariaPadrao != null && ` • ${formatarMoeda(quarto.diariaPadrao)}/noite`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAbrirObservacao(quarto)}
              title="Editar observação rápida"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 active:scale-95 hover:bg-slate-50"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
            {isGerente && (
              <button
                type="button"
                onClick={() => onAbrirEdicaoQuarto(quarto)}
                title="Editar cadastro do quarto"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:scale-95 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dados da Hospedagem ou Reserva Atual */}
        {hosp && (
          <div className="rounded-xl bg-white/90 p-3 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm text-slate-900 truncate">{hosp.nomeHospede}</span>
              <span className="flex items-center gap-1 text-xs font-medium text-slate-600 shrink-0">
                <Users className="h-3.5 w-3.5" />
                {hosp.quantidadePessoas}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                Entrada {formatarDataBR(hosp.dataCheckin, true)} →{' '}
                <strong className="text-slate-900">
                  Saída {formatarDataBR(hosp.dataCheckoutPrevista, true)}
                </strong>{' '}
                ({hosp.quantidadeDiarias}d)
              </span>
              {hosp.saldoAReceber > 0 ? (
                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                  Falta {formatarMoeda(hosp.saldoAReceber)}
                </span>
              ) : (
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                  Quitado ({formatarMoeda(hosp.valorTotal)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Próxima Reserva Futura (aviso discreto) */}
        {quarto.proximaReserva && (
          <div className="rounded-xl bg-sky-50/90 p-2.5 border border-sky-200 text-xs text-sky-950 space-y-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1 font-bold text-sky-800 truncate">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                Próxima Reserva: {quarto.proximaReserva.nomeHospede}
              </span>
              <span className="text-[11px] font-semibold text-sky-700 shrink-0">
                {formatarDataBR(quarto.proximaReserva.dataCheckin, true)} ({quarto.proximaReserva.quantidadeDiarias}d)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-sky-700">
              <span>
                {quarto.proximaReserva.quantidadePessoas} pessoa(s)
                {quarto.proximaReserva.valorAntecipado > 0 &&
                  ` • Sinal: ${formatarMoeda(quarto.proximaReserva.valorAntecipado)}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAbrirCheckin(quarto, quarto.proximaReserva)}
                  className="font-bold text-emerald-700 hover:underline active:scale-95"
                >
                  Dar Entrada
                </button>
                {onCancelarReserva && (
                  <button
                    type="button"
                    onClick={() => onCancelarReserva(quarto.proximaReserva!.id)}
                    className="font-medium text-rose-600 hover:underline active:scale-95"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Observação Atual do Quarto */}
        {quarto.observacaoAtual && (
          <div
            className={`flex items-start gap-2 rounded-xl p-2.5 text-xs ${
              quarto.status === 'EM_MANUTENCAO'
                ? 'bg-slate-800 text-slate-100 font-medium'
                : 'bg-white/80 text-slate-700 border border-slate-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <span className="break-words">{quarto.observacaoAtual}</span>
          </div>
        )}

        {/* Botões de Ação Contextuais (Mobile Touch >= 44px) */}
        {quarto.ativo && (
          <div className="pt-1 flex flex-wrap gap-2">
            {quarto.status === 'DISPONIVEL' && (
              <>
                <button
                  type="button"
                  onClick={() => onAbrirCheckin(quarto)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] hover:bg-emerald-700"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Check-in</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirReserva(quarto)}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-sky-300 bg-white px-3 py-2.5 text-xs font-bold text-sky-700 active:scale-[0.98]"
                >
                  <CalendarClock className="h-4 w-4" />
                  <span>Reservar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirManutencao(quarto)}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 active:scale-[0.98]"
                >
                  <Wrench className="h-4 w-4" />
                </button>
              </>
            )}

            {quarto.status === 'RESERVADO' && (
              <>
                <button
                  type="button"
                  onClick={() => onAbrirCheckin(quarto, hosp)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] hover:bg-sky-700"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Converter Check-in</span>
                </button>
                {hosp && onCancelarReserva && (
                  <button
                    type="button"
                    onClick={() => onCancelarReserva(hosp.id)}
                    className="flex min-h-[44px] items-center justify-center rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-bold text-rose-700 active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAlterarStatusDireto(quarto, 'DISPONIVEL')}
                  className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 active:scale-[0.98]"
                >
                  Liberar
                </button>
              </>
            )}

            {quarto.status === 'OCUPADO' && (
              <>
                <button
                  type="button"
                  onClick={() => onAbrirCheckout(quarto)}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] hover:bg-rose-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Check-out</span>
                </button>
                {isGerente && hosp && (
                  <button
                    type="button"
                    onClick={() => onAbrirEstorno(quarto)}
                    className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-bold text-rose-700 active:scale-[0.98]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Estornar</span>
                  </button>
                )}
              </>
            )}

            {quarto.status === 'AGUARDANDO_LIMPEZA' && (
              <>
                <button
                  type="button"
                  onClick={() => onAlterarStatusDireto(quarto, 'EM_LIMPEZA')}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Iniciar Limpeza</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlterarStatusDireto(quarto, 'DISPONIVEL')}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Liberar Quarto</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirManutencao(quarto)}
                  className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 active:scale-[0.98]"
                >
                  <Wrench className="h-4 w-4" />
                </button>
              </>
            )}

            {quarto.status === 'EM_LIMPEZA' && (
              <>
                <button
                  type="button"
                  onClick={() => onAlterarStatusDireto(quarto, 'DISPONIVEL')}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Concluir Limpeza (Disponível)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAbrirManutencao(quarto)}
                  className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 active:scale-[0.98]"
                >
                  <Wrench className="h-4 w-4" />
                </button>
              </>
            )}

            {quarto.status === 'EM_MANUTENCAO' && (
              <>
                <button
                  type="button"
                  onClick={() => onAlterarStatusDireto(quarto, 'DISPONIVEL')}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm active:scale-[0.98]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Reparo Concluído (Livre)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAlterarStatusDireto(quarto, 'AGUARDANDO_LIMPEZA')}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-xs font-bold text-amber-700 active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Limpar</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
