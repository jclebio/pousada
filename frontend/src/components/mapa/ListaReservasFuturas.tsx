import React from 'react';
import {
  CalendarClock,
  Clock,
  LogIn,
  Trash2,
  Users
} from 'lucide-react';
import type { QuartoMapa, ReservaItem } from '../../types';
import {
  formatarDataBR,
  formatarDiaSemanaCurto,
  formatarMoeda,
  hojeISO
} from '../../utils/formatters';

interface ListaReservasFuturasProps {
  reservas: ReservaItem[];
  quartos: QuartoMapa[];
  onConfirmarCheckin: (reserva: ReservaItem, quarto: QuartoMapa) => void;
  onCancelarReserva: (reservaId: number) => void;
}

function calcularDiferencaDias(dataISO: string): number {
  const hoje = hojeISO();
  const d1 = new Date(hoje + 'T00:00:00');
  const d2 = new Date(dataISO + 'T00:00:00');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export const ListaReservasFuturas: React.FC<ListaReservasFuturasProps> = ({
  reservas,
  quartos,
  onConfirmarCheckin,
  onCancelarReserva
}) => {
  if (reservas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/50 p-8 text-center text-slate-600 space-y-2">
        <CalendarClock className="mx-auto h-10 w-10 text-sky-500" />
        <h3 className="text-base font-bold text-slate-800">Nenhuma reserva agendada</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Não há reservas futuras ativas no momento. Você pode agendar novas reservas tocando no
          botão &ldquo;Reservar&rdquo; em qualquer quarto livre do Mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4 text-sky-600" />
          <span>Reservas Agendadas ({reservas.length})</span>
        </h2>
        <span className="text-xs text-slate-500">Ordenado por data de chegada</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {reservas.map((reserva) => {
          const quarto = quartos.find((q) => q.id === reserva.quartoId);
          const diffDias = calcularDiferencaDias(reserva.dataCheckin);
          const isHoje = diffDias === 0;

          // Quarto pronto para check-in se estiver livre ou se já for hoje
          const quartoLivre = quarto ? quarto.status === 'DISPONIVEL' || quarto.status === 'RESERVADO' : false;
          const podeCheckin = Boolean(quarto && quartoLivre);

          const saldoPagar =
            reserva.saldoAReceber > 0
              ? reserva.saldoAReceber
              : Math.max(0, reserva.valorTotal - reserva.valorAntecipado);

          return (
            <div
              key={reserva.id}
              className={`relative overflow-hidden rounded-2xl border-2 shadow-sm transition bg-white ${
                isHoje ? 'border-sky-400 bg-sky-50/40' : 'border-sky-200'
              }`}
            >
              {/* Barra de destaque superior */}
              <div className={`h-1.5 w-full ${isHoje ? 'bg-sky-600' : 'bg-sky-400'}`} />

              <div className="p-4 space-y-3">
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-slate-900">
                        Quarto {reserva.numeroQuarto}
                      </span>
                      {isHoje ? (
                        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                          Chegada Hoje
                        </span>
                      ) : diffDias === 1 ? (
                        <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-bold text-white">
                          Amanhã
                        </span>
                      ) : diffDias > 1 ? (
                        <span className="rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5 text-xs font-semibold">
                          Em {diffDias} dias
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">
                          Data anterior
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {quarto?.descricao || 'Suíte padrão'}
                      {quarto && (
                        <>
                          {' • '}
                          <span
                            className={
                              quarto.status === 'DISPONIVEL'
                                ? 'font-semibold text-emerald-700'
                                : quarto.status === 'RESERVADO'
                                  ? 'font-semibold text-sky-700'
                                  : 'font-semibold text-rose-700'
                            }
                          >
                            Hoje: {quarto.status === 'DISPONIVEL' ? 'Livre' : quarto.status}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{reserva.quantidadeDiarias} noite(s)</span>
                  </div>
                </div>

                {/* Dados do Hóspede e Datas */}
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {reserva.nomeHospede}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-600 shrink-0">
                      <Users className="h-3.5 w-3.5" />
                      {reserva.quantidadePessoas} pessoa(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">
                        Entrada
                      </span>
                      <strong className="text-slate-900">
                        {formatarDataBR(reserva.dataCheckin)}
                      </strong>{' '}
                      <span className="text-[11px] text-slate-500">
                        ({formatarDiaSemanaCurto(reserva.dataCheckin)})
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">
                        Saída Prevista
                      </span>
                      <strong className="text-slate-900">
                        {formatarDataBR(reserva.dataCheckoutPrevista)}
                      </strong>{' '}
                      <span className="text-[11px] text-slate-500">
                        ({formatarDiaSemanaCurto(reserva.dataCheckoutPrevista)})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo Financeiro (Total, Sinal Antecipado e Saldo Restante) */}
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-sky-50/70 p-2.5 border border-sky-100 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Valor Total
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatarMoeda(reserva.valorTotal)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-sky-800">
                      Sinal Pago
                    </span>
                    <span className="text-xs font-bold text-sky-900">
                      {formatarMoeda(reserva.valorAntecipado)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Saldo Restante
                    </span>
                    <span
                      className={`text-xs font-extrabold ${
                        saldoPagar > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatarMoeda(saldoPagar)}
                    </span>
                  </div>
                </div>

                {/* Botões de Ação Rápidos (Mobile Touch >= 44px) */}
                <div className="pt-1 flex items-center gap-2">
                  {podeCheckin ? (
                    <button
                      type="button"
                      onClick={() => quarto && onConfirmarCheckin(reserva, quarto)}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] hover:bg-emerald-700"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Confirmar Check-in</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title={`Quarto ${reserva.numeroQuarto} está ocupado ou em serviço no momento.`}
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-400 cursor-not-allowed"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Quarto Indisponível Hoje</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onCancelarReserva(reserva.id)}
                    className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-xs font-bold text-rose-700 active:scale-[0.98] hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
