import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type {
  CheckinPayload,
  EditarHospedagemPayload,
  HospedagemResumoMapa,
  QuartoMapa,
  QuartoRequest,
  RenovarDiariaPayload,
  ReservaItem,
  ReservaPayload,
  StatusQuarto
} from '../types';
import { ResumoStatusBar, type FiltroStatusMapa } from '../components/mapa/ResumoStatusBar';
import { QuartoCard } from '../components/mapa/QuartoCard';
import { ListaReservasFuturas } from '../components/mapa/ListaReservasFuturas';
import { CheckinModal } from '../components/mapa/CheckinModal';
import { ReservaModal } from '../components/mapa/ReservaModal';
import { CheckoutModal } from '../components/mapa/CheckoutModal';
import { ManutencaoObservacaoModal } from '../components/mapa/ManutencaoObservacaoModal';
import { EstornoModal } from '../components/mapa/EstornoModal';
import { QuartoFormModal } from '../components/mapa/QuartoFormModal';
import { RenovarDiariaModal } from '../components/mapa/RenovarDiariaModal';
import { EditarHospedagemModal } from '../components/mapa/EditarHospedagemModal';

interface MapaOperacionalPageProps {
  sinalAtualizacao: number;
  onMudarEstadoCarregamento: (carregando: boolean) => void;
  onNotificarMensagemWhatsapp?: (msg: string | null | undefined) => void;
}

export const MapaOperacionalPage: React.FC<MapaOperacionalPageProps> = ({
  sinalAtualizacao,
  onMudarEstadoCarregamento,
  onNotificarMensagemWhatsapp
}) => {
  const { isGerente } = useAuth();
  const [quartos, setQuartos] = useState<QuartoMapa[]>([]);
  const [reservas, setReservas] = useState<ReservaItem[]>([]);
  const [filtro, setFiltro] = useState<FiltroStatusMapa>('TODOS');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [erroBanner, setErroBanner] = useState<string | null>(null);
  const [toastSucesso, setToastSucesso] = useState<string | null>(null);

  // Modais
  const [quartoCheckin, setQuartoCheckin] = useState<QuartoMapa | null>(null);
  const [reservaCheckin, setReservaCheckin] = useState<HospedagemResumoMapa | null>(null);
  // quartoReserva: null = modal fechado | QuartoMapa = pré-selecionado | 'global' = sem pré-seleção
  const [quartoReserva, setQuartoReserva] = useState<QuartoMapa | 'global' | null>(null);
  const [quartoCheckout, setQuartoCheckout] = useState<QuartoMapa | null>(null);
  const [modalTexto, setModalTexto] = useState<{
    quarto: QuartoMapa;
    modo: 'manutencao' | 'observacao';
  } | null>(null);
  const [quartoEstorno, setQuartoEstorno] = useState<QuartoMapa | null>(null);
  const [quartoRenovacao, setQuartoRenovacao] = useState<QuartoMapa | null>(null);
  const [quartoEdicaoHosp, setQuartoEdicaoHosp] = useState<QuartoMapa | null>(null);
  const [modalQuartoForm, setModalQuartoForm] = useState<{
    aberto: boolean;
    quarto?: QuartoMapa | null;
  }>({ aberto: false, quarto: null });

  const exibirToast = (msg: string) => {
    setToastSucesso(msg);
    window.setTimeout(() => {
      setToastSucesso((atual) => (atual === msg ? null : atual));
    }, 3000);
  };

  const carregarDados = useCallback(async () => {
    try {
      onMudarEstadoCarregamento(true);
      const [lista, listaReservas] = await Promise.all([
        api.listarQuartos(isGerente && mostrarInativos),
        api.listarReservas()
      ]);
      setQuartos(lista);
      setReservas(listaReservas);
      setErroBanner(null);
    } catch (err) {
      setErroBanner(err instanceof Error ? err.message : 'Erro ao carregar dados do mapa.');
    } finally {
      onMudarEstadoCarregamento(false);
    }
  }, [isGerente, mostrarInativos, onMudarEstadoCarregamento]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados, sinalAtualizacao]);

  // Atualização em tempo real (polling leve quando visível)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void carregarDados();
      }
    }, 10000);
    return () => window.clearInterval(id);
  }, [carregarDados]);

  const handleStatusDireto = async (quarto: QuartoMapa, novoStatus: StatusQuarto) => {
    try {
      const res = await api.alterarStatusQuarto(quarto.id, novoStatus);
      exibirToast(`Quarto ${quarto.numero} atualizado.`);
      if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
      await carregarDados();
    } catch (err) {
      setErroBanner(err instanceof Error ? err.message : 'Falha ao mudar status do quarto.');
    }
  };

  const handleAbrirCheckin = (quarto: QuartoMapa, reserva?: HospedagemResumoMapa | null) => {
    setQuartoCheckin(quarto);
    setReservaCheckin(reserva ?? null);
  };

  // Handler para check-in a partir da lista de reservas
  const handleCheckinDeReserva = (reserva: ReservaItem, quarto: QuartoMapa) => {
    // Converte ReservaItem → HospedagemResumoMapa para o modal de check-in
    const resumo: HospedagemResumoMapa = {
      id: reserva.id,
      nomeHospede: reserva.nomeHospede,
      quantidadePessoas: reserva.quantidadePessoas,
      dataCheckin: reserva.dataCheckin,
      quantidadeDiarias: reserva.quantidadeDiarias,
      dataCheckoutPrevista: reserva.dataCheckoutPrevista,
      statusHospedagem: reserva.statusHospedagem,
      valorTotal: reserva.valorTotal,
      valorAntecipado: reserva.valorAntecipado,
      valorPagoCheckin: reserva.valorPagoCheckin,
      saldoAReceber: reserva.saldoAReceber,
      registradoPor: reserva.registradoPor
    };
    setQuartoCheckin(quarto);
    setReservaCheckin(resumo);
  };

  const handleCancelarReserva = async (reservaId: number) => {
    if (!window.confirm('Deseja realmente cancelar esta reserva?')) {
      return;
    }
    try {
      const res = await api.cancelarReserva(reservaId);
      exibirToast('Reserva cancelada com sucesso.');
      if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
      await carregarDados();
    } catch (err) {
      setErroBanner(err instanceof Error ? err.message : 'Falha ao cancelar reserva.');
    }
  };

  const handleConfirmarCheckin = async (payload: CheckinPayload) => {
    const res = await api.realizarCheckin(payload);
    setQuartoCheckin(null);
    setReservaCheckin(null);
    // Voltar ao mapa geral após check-in a partir da lista de reservas
    if (filtro === 'RESERVADO') setFiltro('TODOS');
    exibirToast('Check-in realizado com sucesso!');
    if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    await carregarDados();
  };

  const handleConfirmarReserva = async (payload: ReservaPayload) => {
    const res = await api.registrarReserva(payload);
    setQuartoReserva(null);
    exibirToast('Reserva registrada!');
    if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    await carregarDados();
  };

  const handleConfirmarCheckout = async (valorPagoCheckout: number, obs?: string) => {
    if (!quartoCheckout) return;
    const res = await api.realizarCheckout(quartoCheckout.id, valorPagoCheckout, obs);
    setQuartoCheckout(null);
    exibirToast('Check-out concluído! Quarto aguardando limpeza.');
    if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    await carregarDados();
  };

  const handleConfirmarModalTexto = async (texto: string) => {
    if (!modalTexto) return;
    if (modalTexto.modo === 'manutencao') {
      const res = await api.alterarStatusQuarto(modalTexto.quarto.id, 'EM_MANUTENCAO', texto);
      exibirToast(`Quarto ${modalTexto.quarto.numero} em manutenção.`);
      if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    } else {
      await api.atualizarObservacaoQuarto(modalTexto.quarto.id, texto || null);
      exibirToast('Observação atualizada.');
    }
    setModalTexto(null);
    await carregarDados();
  };

  const handleConfirmarEstorno = async (motivo: string) => {
    if (!quartoEstorno?.hospedagemAtual) return;
    const res = await api.estornarHospedagem(quartoEstorno.hospedagemAtual.id, motivo);
    setQuartoEstorno(null);
    exibirToast('Check-in estornado com sucesso.');
    if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    await carregarDados();
  };

  const handleConfirmarRenovacao = async (payload: RenovarDiariaPayload) => {
    if (!quartoRenovacao?.hospedagemAtual) return;
    const res = await api.renovarDiarias(quartoRenovacao.hospedagemAtual.id, payload);
    setQuartoRenovacao(null);
    exibirToast('Diária renovada com sucesso!');
    if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    await carregarDados();
  };

  const handleConfirmarEdicaoHospedagem = async (
    hospedagemId: number,
    payload: EditarHospedagemPayload
  ) => {
    const res = await api.editarHospedagem(hospedagemId, payload);
    setQuartoEdicaoHosp(null);
    exibirToast('Hospedagem atualizada com sucesso!');
    if (res.mensagemWhatsapp) onNotificarMensagemWhatsapp?.(res.mensagemWhatsapp);
    await carregarDados();
  };

  const handleSalvarQuarto = async (payload: QuartoRequest) => {
    if (modalQuartoForm.quarto) {
      await api.atualizarQuarto(modalQuartoForm.quarto.id, payload);
      exibirToast(`Quarto ${payload.numero} atualizado!`);
    } else {
      await api.criarQuarto(payload);
      exibirToast(`Quarto ${payload.numero} cadastrado!`);
    }
    setModalQuartoForm({ aberto: false, quarto: null });
    await carregarDados();
  };

  // Quando o filtro é RESERVADO, mostra a lista de reservas futuras em vez dos cards
  const modoListaReservas = filtro === 'RESERVADO';

  const quartosVisiveis = quartos.filter((q) => {
    if (modoListaReservas || filtro === 'TODOS') return true;
    return q.status === filtro;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 pb-24 space-y-4">
      {/* Barra Gerencial no Topo da Aba Mapa (Exclusiva GERENTE) */}
      {isGerente && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-sm">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 select-none">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(e) => setMostrarInativos(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>Mostrar inativos</span>
          </label>

          <button
            type="button"
            onClick={() => setModalQuartoForm({ aberto: true, quarto: null })}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            <span>+ Quarto</span>
          </button>
        </div>
      )}

      {/* Botão global "+ Nova Reserva" — visível a todos os perfis */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setQuartoReserva('global')}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3.5 py-2 text-xs font-bold text-sky-700 shadow-sm active:scale-95 hover:bg-sky-50"
        >
          <CalendarClock className="h-4 w-4" />
          <span>+ Nova Reserva</span>
        </button>
      </div>

      {toastSucesso && (
        <div className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md">
          {toastSucesso}
        </div>
      )}

      {erroBanner && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
          {erroBanner}
        </div>
      )}

      <ResumoStatusBar
        quartos={quartos}
        totalReservas={reservas.length}
        filtroAtual={filtro}
        onAlterarFiltro={setFiltro}
      />

      {/* Vista: Lista de reservas futuras (filtro RESERVADO) */}
      {modoListaReservas ? (
        <ListaReservasFuturas
          reservas={reservas}
          quartos={quartos}
          onConfirmarCheckin={handleCheckinDeReserva}
          onCancelarReserva={handleCancelarReserva}
        />
      ) : quartosVisiveis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum quarto encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {quartosVisiveis.map((quarto) => (
            <QuartoCard
              key={quarto.id}
              quarto={quarto}
              isGerente={isGerente}
              onAbrirCheckin={handleAbrirCheckin}
              onAbrirReserva={setQuartoReserva}
              onAbrirCheckout={setQuartoCheckout}
              onAbrirManutencao={(q) => setModalTexto({ quarto: q, modo: 'manutencao' })}
              onAbrirObservacao={(q) => setModalTexto({ quarto: q, modo: 'observacao' })}
              onAbrirEstorno={setQuartoEstorno}
              onAbrirRenovacao={setQuartoRenovacao}
              onAbrirEdicaoHospedagem={setQuartoEdicaoHosp}
              onAbrirEdicaoQuarto={(q) => setModalQuartoForm({ aberto: true, quarto: q })}
              onAlterarStatusDireto={handleStatusDireto}
              onCancelarReserva={handleCancelarReserva}
            />
          ))}
        </div>
      )}

      {quartoCheckin && (
        <CheckinModal
          quarto={quartoCheckin}
          reservaPreviaProp={reservaCheckin}
          onFechar={() => {
            setQuartoCheckin(null);
            setReservaCheckin(null);
          }}
          onConfirmar={handleConfirmarCheckin}
        />
      )}

      {quartoReserva && (
        <ReservaModal
          quarto={quartoReserva === 'global' ? null : quartoReserva}
          quartosDisponiveis={quartos.filter((q) => q.ativo)}
          onFechar={() => setQuartoReserva(null)}
          onConfirmar={handleConfirmarReserva}
        />
      )}

      {quartoCheckout && (
        <CheckoutModal
          quarto={quartoCheckout}
          onFechar={() => setQuartoCheckout(null)}
          onConfirmar={handleConfirmarCheckout}
        />
      )}

      {modalTexto && (
        <ManutencaoObservacaoModal
          quarto={modalTexto.quarto}
          modo={modalTexto.modo}
          onFechar={() => setModalTexto(null)}
          onConfirmar={handleConfirmarModalTexto}
        />
      )}

      {quartoEstorno && (
        <EstornoModal
          quarto={quartoEstorno}
          onFechar={() => setQuartoEstorno(null)}
          onConfirmar={handleConfirmarEstorno}
        />
      )}

      {quartoRenovacao && (
        <RenovarDiariaModal
          quarto={quartoRenovacao}
          onFechar={() => setQuartoRenovacao(null)}
          onConfirmar={handleConfirmarRenovacao}
        />
      )}

      {quartoEdicaoHosp && (
        <EditarHospedagemModal
          quarto={quartoEdicaoHosp}
          isGerente={isGerente}
          onFechar={() => setQuartoEdicaoHosp(null)}
          onConfirmar={handleConfirmarEdicaoHospedagem}
        />
      )}

      {modalQuartoForm.aberto && (
        <QuartoFormModal
          quartoExistente={modalQuartoForm.quarto}
          onFechar={() => setModalQuartoForm({ aberto: false, quarto: null })}
          onSalvar={handleSalvarQuarto}
        />
      )}
    </div>
  );
};
