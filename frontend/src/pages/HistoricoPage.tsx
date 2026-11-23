import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  Loader2,
  Printer,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatarDataBR, formatarMoeda } from '../utils/formatters';
import type { HistoricoPage as HistoricoPageData, ReservaItem, StatusHospedagem } from '../types';
import { ModalImpressaoHistorico } from '../components/historico/ModalImpressaoHistorico';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<StatusHospedagem, string> = {
  ATIVA: 'Ativa',
  FINALIZADA: 'Finalizada',
  ESTORNADA: 'Estornada',
  RESERVADA: 'Reservada',
  CANCELADA: 'Cancelada',
};

const STATUS_BADGE: Record<StatusHospedagem, string> = {
  ATIVA: 'bg-emerald-100 text-emerald-800',
  FINALIZADA: 'bg-blue-100 text-blue-800',
  ESTORNADA: 'bg-orange-100 text-orange-800',
  RESERVADA: 'bg-violet-100 text-violet-800',
  CANCELADA: 'bg-red-100 text-red-800',
};

const TODOS_STATUS: StatusHospedagem[] = ['ATIVA', 'RESERVADA', 'FINALIZADA', 'ESTORNADA', 'CANCELADA'];

// ─── Chip de status ───────────────────────────────────────────────────────────

interface StatusChipProps {
  status: StatusHospedagem;
  selecionado: boolean;
  onClick: () => void;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, selecionado, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-semibold border transition active:scale-95 whitespace-nowrap ${
      selecionado
        ? STATUS_BADGE[status] + ' border-transparent ring-2 ring-offset-1 ring-current'
        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
    }`}
  >
    {STATUS_LABEL[status]}
  </button>
);

// ─── Card de hospedagem ───────────────────────────────────────────────────────

const HospedagemCard: React.FC<{ item: ReservaItem }> = ({ item }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
          Quarto {item.numeroQuarto}
        </span>
        <p className="font-semibold text-slate-800 text-sm leading-tight mt-0.5">
          {item.nomeHospede}
        </p>
        {item.registradoPor && (
          <p className="text-xs text-slate-400 mt-0.5">por {item.registradoPor}</p>
        )}
      </div>
      <span
        className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[item.statusHospedagem]}`}
      >
        {STATUS_LABEL[item.statusHospedagem]}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
      <div>
        <span className="text-slate-400">Check-in</span>
        <p className="font-medium text-slate-700">{formatarDataBR(item.dataCheckin)}</p>
      </div>
      <div>
        <span className="text-slate-400">
          {item.dataCheckoutReal ? 'Check-out real' : 'Saída prevista'}
        </span>
        <p className="font-medium text-slate-700">
          {item.dataCheckoutReal
            ? formatarDataBR(item.dataCheckoutReal.slice(0, 10))
            : formatarDataBR(item.dataCheckoutPrevista)}
        </p>
      </div>
      <div>
        <span className="text-slate-400">Diárias</span>
        <p className="font-medium text-slate-700">{item.quantidadeDiarias}</p>
      </div>
      <div>
        <span className="text-slate-400">Pessoas</span>
        <p className="font-medium text-slate-700">{item.quantidadePessoas}</p>
      </div>
    </div>

    <div className="pt-1 border-t border-slate-50 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <div>
        <span className="text-slate-400">Total</span>
        <p className="font-semibold text-slate-700">{formatarMoeda(item.valorTotal)}</p>
      </div>
      <div>
        <span className="text-slate-400">Saldo</span>
        <p
          className={`font-semibold ${
            item.saldoAReceber > 0 ? 'text-amber-600' : 'text-emerald-600'
          }`}
        >
          {formatarMoeda(item.saldoAReceber)}
        </p>
      </div>
    </div>
  </div>
);

// ─── Página principal ─────────────────────────────────────────────────────────

export const HistoricoPage: React.FC = () => {
  const { isGerente } = useAuth();

  // Filtros
  const [statusSelecionados, setStatusSelecionados] = useState<StatusHospedagem[]>([]);
  const [nomeHospede, setNomeHospede] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [quartoIdStr, setQuartoIdStr] = useState('');
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);

  // Exportação
  const [menuExportarAberto, setMenuExportarAberto] = useState(false);
  const [exportandoCsv, setExportandoCsv] = useState(false);
  const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);

  // Paginação / dados
  const [paginas, setPaginas] = useState<ReservaItem[]>([]);
  const [pageAtual, setPageAtual] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Buscar primeira página sempre que os filtros mudarem
  const buscarPrimeiraPagina = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado: HistoricoPageData = await api.listarHistorico({
        status: statusSelecionados.length > 0 ? statusSelecionados : undefined,
        quartoId: isGerente && quartoIdStr ? Number(quartoIdStr) : undefined,
        nomeHospede: nomeHospede || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        page: 0,
        size: 20,
      });
      setPaginas(resultado.content);
      setPageAtual(0);
      setTotalElements(resultado.totalElements);
      setIsLast(resultado.last);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar histórico.');
    } finally {
      setCarregando(false);
    }
  }, [statusSelecionados, nomeHospede, dataInicio, dataFim, quartoIdStr, isGerente]);

  useEffect(() => {
    void buscarPrimeiraPagina();
  }, [buscarPrimeiraPagina]);

  const carregarMais = async () => {
    if (isLast || carregando) return;
    setCarregando(true);
    try {
      const proxPage = pageAtual + 1;
      const resultado: HistoricoPageData = await api.listarHistorico({
        status: statusSelecionados.length > 0 ? statusSelecionados : undefined,
        quartoId: isGerente && quartoIdStr ? Number(quartoIdStr) : undefined,
        nomeHospede: nomeHospede || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        page: proxPage,
        size: 20,
      });
      setPaginas(prev => [...prev, ...resultado.content]);
      setPageAtual(proxPage);
      setIsLast(resultado.last);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar mais.');
    } finally {
      setCarregando(false);
    }
  };

  const toggleStatus = (s: StatusHospedagem) => {
    setStatusSelecionados(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const limparFiltros = () => {
    setStatusSelecionados([]);
    setNomeHospede('');
    setDataInicio('');
    setDataFim('');
    setQuartoIdStr('');
  };

  const temFiltroAtivo =
    statusSelecionados.length > 0 ||
    nomeHospede ||
    dataInicio ||
    dataFim ||
    quartoIdStr;

  const obterDescricaoFiltros = () => {
    const partes: string[] = [];
    if (statusSelecionados.length > 0) {
      partes.push(`Status: ${statusSelecionados.map(s => STATUS_LABEL[s]).join(', ')}`);
    } else {
      partes.push('Status: Todos');
    }
    if (nomeHospede) partes.push(`Hóspede: "${nomeHospede}"`);
    if (dataInicio && dataFim) partes.push(`Período: ${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`);
    else if (dataInicio) partes.push(`A partir de: ${formatarDataBR(dataInicio)}`);
    else if (dataFim) partes.push(`Até: ${formatarDataBR(dataFim)}`);
    if (quartoIdStr) partes.push(`Quarto ID: ${quartoIdStr}`);
    return partes.join(' | ');
  };

  const handleExportarCsv = async () => {
    setExportandoCsv(true);
    setMenuExportarAberto(false);
    try {
      await api.exportarHistoricoCsv({
        status: statusSelecionados.length > 0 ? statusSelecionados : undefined,
        quartoId: isGerente && quartoIdStr ? Number(quartoIdStr) : undefined,
        nomeHospede: nomeHospede || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao exportar CSV.');
    } finally {
      setExportandoCsv(false);
    }
  };

  const handleAbrirImpressao = () => {
    setMenuExportarAberto(false);
    setModalImpressaoAberto(true);
  };

  return (
    <div className="pb-24 pt-16 min-h-screen bg-slate-50">
      {/* Painel de filtros fixo abaixo do TopBar */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm px-4 py-3 space-y-3">
        {/* Chips de status */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TODOS_STATUS.map(s => (
            <StatusChip
              key={s}
              status={s}
              selecionado={statusSelecionados.includes(s)}
              onClick={() => toggleStatus(s)}
            />
          ))}
        </div>

        {/* Campo de busca e botões de ação */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar hóspede..."
              value={nomeHospede}
              onChange={e => setNomeHospede(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setMostrarFiltrosAvancados(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition shrink-0 ${
              mostrarFiltrosAvancados
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>

          {/* Botão de Exportação com Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuExportarAberto(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition active:scale-95 shadow-sm"
              title="Opções de exportação"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Exportar</span>
            </button>

            {menuExportarAberto && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuExportarAberto(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-30 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl space-y-1">
                  <button
                    type="button"
                    onClick={handleExportarCsv}
                    disabled={exportandoCsv}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition text-left disabled:opacity-50"
                  >
                    {exportandoCsv ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    )}
                    <div>
                      <p className="font-semibold">Planilha CSV</p>
                      <p className="text-[10px] text-slate-400">Excel / Google Sheets</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleAbrirImpressao}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition text-left"
                  >
                    <Printer className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-semibold">Relatório PDF</p>
                      <p className="text-[10px] text-slate-400">Imprimir / Salvar PDF</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>

        {/* Filtros avançados */}
        {mostrarFiltrosAvancados && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Data início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Data fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {isGerente && (
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-slate-500 font-medium">ID do Quarto</label>
                <input
                  type="number"
                  min="1"
                  placeholder="ex.: 3"
                  value={quartoIdStr}
                  onChange={e => setQuartoIdStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {/* Contagem */}
        {!carregando && !erro && (
          <p className="text-xs text-slate-400 text-right">
            {paginas.length} de {totalElements} registro(s)
          </p>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm">
            {erro}
            <button
              type="button"
              onClick={buscarPrimeiraPagina}
              className="mt-2 block text-xs underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista */}
        {paginas.map(item => (
          <HospedagemCard key={item.id} item={item} />
        ))}

        {/* Estado vazio */}
        {!carregando && !erro && paginas.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">Nenhum registro encontrado.</p>
            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-2 text-xs text-emerald-600 underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Carregar mais */}
        {!isLast && paginas.length > 0 && (
          <button
            type="button"
            onClick={carregarMais}
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {carregando ? 'Carregando...' : 'Carregar mais'}
          </button>
        )}

        {/* Spinner de primeira carga */}
        {carregando && paginas.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}
      </div>

      {/* Modal de Impressão / PDF */}
      <ModalImpressaoHistorico
        aberto={modalImpressaoAberto}
        onFechar={() => setModalImpressaoAberto(false)}
        itens={paginas}
        filtrosDescricao={obterDescricaoFiltros()}
      />
    </div>
  );
};
