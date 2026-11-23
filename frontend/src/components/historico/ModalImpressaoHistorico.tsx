import React from 'react';
import { Printer, X } from 'lucide-react';
import type { ReservaItem } from '../../types';
import { formatarDataBR, formatarMoeda } from '../../utils/formatters';

interface ModalImpressaoHistoricoProps {
  aberto: boolean;
  onFechar: () => void;
  itens: ReservaItem[];
  filtrosDescricao: string;
}

export const ModalImpressaoHistorico: React.FC<ModalImpressaoHistoricoProps> = ({
  aberto,
  onFechar,
  itens,
  filtrosDescricao,
}) => {
  if (!aberto) return null;

  const totalValor = itens.reduce((acc, h) => acc + (h.valorTotal || 0), 0);
  const totalRecebido = itens.reduce((acc, h) => acc + (h.totalRecebido || 0), 0);
  const totalSaldo = itens.reduce((acc, h) => acc + (h.saldoAReceber || 0), 0);

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Barra superior de ações (oculta na impressão) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Pré-visualização do Relatório</h3>
            <p className="text-xs text-slate-400">Pronto para impressão ou exportação em PDF</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImprimir}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo imprimível */}
        <div className="p-6 overflow-y-auto print:overflow-visible print:p-0 space-y-6 text-slate-800" id="area-impressao-historico">
          {/* Cabeçalho do documento */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">POUSADA GESTÃO</h1>
                <h2 className="text-sm font-semibold text-slate-600 mt-0.5">Relatório de Histórico de Hospedagens</h2>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="mt-0.5 font-medium text-slate-600">{filtrosDescricao}</p>
              </div>
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-50 print:bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 font-medium">Registros</span>
              <p className="text-lg font-bold text-slate-800">{itens.length}</p>
            </div>
            <div className="bg-slate-50 print:bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 font-medium">Valor Total</span>
              <p className="text-lg font-bold text-slate-800">{formatarMoeda(totalValor)}</p>
            </div>
            <div className="bg-slate-50 print:bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 font-medium">Total Recebido</span>
              <p className="text-lg font-bold text-emerald-700">{formatarMoeda(totalRecebido)}</p>
            </div>
            <div className="bg-slate-50 print:bg-white border border-slate-200 rounded-xl p-3">
              <span className="text-xs text-slate-500 font-medium">Saldo Pendente</span>
              <p className={`text-lg font-bold ${totalSaldo > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {formatarMoeda(totalSaldo)}
              </p>
            </div>
          </div>

          {/* Tabela de registros */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 print:bg-slate-100 font-semibold text-slate-700">
                  <th className="py-2 px-2">Qto</th>
                  <th className="py-2 px-2">Hóspede</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Check-in</th>
                  <th className="py-2 px-2">Saída</th>
                  <th className="py-2 px-2 text-center">Diárias</th>
                  <th className="py-2 px-2 text-right">Total</th>
                  <th className="py-2 px-2 text-right">Recebido</th>
                  <th className="py-2 px-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                    <td className="py-2 px-2 font-bold text-slate-900">{item.numeroQuarto}</td>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      <div>{item.nomeHospede}</div>
                      {item.registradoPor && (
                        <div className="text-[10px] text-slate-400">por {item.registradoPor}</div>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                        {item.statusHospedagem}
                      </span>
                    </td>
                    <td className="py-2 px-2 whitespace-nowrap">{formatarDataBR(item.dataCheckin)}</td>
                    <td className="py-2 px-2 whitespace-nowrap">
                      {item.dataCheckoutReal
                        ? formatarDataBR(item.dataCheckoutReal.slice(0, 10))
                        : formatarDataBR(item.dataCheckoutPrevista)}
                    </td>
                    <td className="py-2 px-2 text-center">{item.quantidadeDiarias}</td>
                    <td className="py-2 px-2 text-right font-medium">{formatarMoeda(item.valorTotal)}</td>
                    <td className="py-2 px-2 text-right text-emerald-700 font-medium">
                      {formatarMoeda(item.totalRecebido)}
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      <span className={item.saldoAReceber > 0 ? 'text-amber-700' : 'text-slate-500'}>
                        {formatarMoeda(item.saldoAReceber)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 print:pt-6">
            Pousada Gestão — Relatório gerado eletronicamente para controle operacional e financeiro.
          </div>
        </div>
      </div>
    </div>
  );
};
