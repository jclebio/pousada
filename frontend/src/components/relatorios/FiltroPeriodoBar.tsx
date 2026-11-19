import React from 'react';
import { CalendarRange } from 'lucide-react';
import { hojeISO, somarDiasISO } from '../../utils/formatters';

export type PresetPeriodo = 'ESTE_MES' | 'ULTIMOS_30' | 'PROXIMOS_15' | 'PERSONALIZADO';

interface FiltroPeriodoBarProps {
  presetAtivo: PresetPeriodo;
  dataInicio: string;
  dataFim: string;
  onSelecionarPeriodo: (preset: PresetPeriodo, inicio: string, fim: string) => void;
  onAlterarDatasPersonalizadas: (inicio: string, fim: string) => void;
}

export function calcularDatasPreset(preset: Exclude<PresetPeriodo, 'PERSONALIZADO'>): {
  inicio: string;
  fim: string;
} {
  const hoje = hojeISO();
  if (preset === 'ULTIMOS_30') {
    return { inicio: somarDiasISO(hoje, -29), fim: hoje };
  }
  if (preset === 'PROXIMOS_15') {
    return { inicio: hoje, fim: somarDiasISO(hoje, 14) };
  }
  // ESTE_MES
  const [ano, mes] = hoje.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const m = String(mes).padStart(2, '0');
  const dFim = String(ultimoDia).padStart(2, '0');
  return { inicio: `${ano}-${m}-01`, fim: `${ano}-${m}-${dFim}` };
}

export const FiltroPeriodoBar: React.FC<FiltroPeriodoBarProps> = ({
  presetAtivo,
  dataInicio,
  dataFim,
  onSelecionarPeriodo,
  onAlterarDatasPersonalizadas
}) => {
  const opcoes: { id: PresetPeriodo; label: string }[] = [
    { id: 'ESTE_MES', label: 'Este mês' },
    { id: 'ULTIMOS_30', label: 'Últimos 30 dias' },
    { id: 'PROXIMOS_15', label: 'Próximos 15 dias' },
    { id: 'PERSONALIZADO', label: 'Personalizado' }
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {opcoes.map((op) => {
          const ativo = presetAtivo === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => {
                if (op.id === 'PERSONALIZADO') {
                  onSelecionarPeriodo('PERSONALIZADO', dataInicio, dataFim);
                } else {
                  const { inicio, fim } = calcularDatasPreset(op.id);
                  onSelecionarPeriodo(op.id, inicio, fim);
                }
              }}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                ativo
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {op.label}
            </button>
          );
        })}
      </div>

      {presetAtivo === 'PERSONALIZADO' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <CalendarRange className="h-4 w-4 text-emerald-600" />
            <span>Intervalo personalizado</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Data inicial
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => onAlterarDatasPersonalizadas(e.target.value, dataFim)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Data final
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => onAlterarDatasPersonalizadas(dataInicio, e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
