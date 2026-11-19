import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { RelatorioVacancia } from '../types';
import {
  calcularDatasPreset,
  FiltroPeriodoBar,
  type PresetPeriodo
} from '../components/relatorios/FiltroPeriodoBar';
import { CardsResumoFinanceiro } from '../components/relatorios/CardsResumoFinanceiro';
import { DesempenhoQuartosList } from '../components/relatorios/DesempenhoQuartosList';
import { DisponibilidadeDiariaList } from '../components/relatorios/DisponibilidadeDiariaList';

interface RelatoriosPageProps {
  sinalAtualizacao: number;
  onMudarEstadoCarregamento: (carregando: boolean) => void;
}

export const RelatoriosPage: React.FC<RelatoriosPageProps> = ({
  sinalAtualizacao,
  onMudarEstadoCarregamento
}) => {
  const inicial = calcularDatasPreset('ESTE_MES');
  const [preset, setPreset] = useState<PresetPeriodo>('ESTE_MES');
  const [dataInicio, setDataInicio] = useState(inicial.inicio);
  const [dataFim, setDataFim] = useState(inicial.fim);
  const [relatorio, setRelatorio] = useState<RelatorioVacancia | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregarRelatorio = useCallback(async () => {
    if (!dataInicio || !dataFim || dataFim < dataInicio) {
      setErro('Selecione um período válido (data final igual ou posterior à inicial).');
      return;
    }
    try {
      onMudarEstadoCarregamento(true);
      const dados = await api.relatorioVacancia(dataInicio, dataFim);
      setRelatorio(dados);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao carregar relatório.');
    } finally {
      onMudarEstadoCarregamento(false);
    }
  }, [dataInicio, dataFim, onMudarEstadoCarregamento]);

  useEffect(() => {
    void carregarRelatorio();
  }, [carregarRelatorio, sinalAtualizacao]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 pb-24 space-y-4">
      <FiltroPeriodoBar
        presetAtivo={preset}
        dataInicio={dataInicio}
        dataFim={dataFim}
        onSelecionarPeriodo={(novoPreset, ini, fim) => {
          setPreset(novoPreset);
          setDataInicio(ini);
          setDataFim(fim);
        }}
        onAlterarDatasPersonalizadas={(ini, fim) => {
          setDataInicio(ini);
          setDataFim(fim);
        }}
      />

      {erro && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-700">
          {erro}
        </div>
      )}

      {relatorio && (
        <>
          <CardsResumoFinanceiro relatorio={relatorio} />
          <DesempenhoQuartosList itens={relatorio.desempenhoPorQuarto} />
          <DisponibilidadeDiariaList dias={relatorio.disponibilidadeDiaria} />
        </>
      )}
    </div>
  );
};
