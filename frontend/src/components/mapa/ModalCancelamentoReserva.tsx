import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { formatarDataBR } from '../../utils/formatters';

export interface DadosCancelamento {
  reservaId: number;
  quartoNumero: string;
  nomeHospede: string;
  dataCheckin: string;
  dataCheckoutPrevista: string;
}

interface Props {
  aberto: boolean;
  dados: DadosCancelamento | null;
  onFechar: () => void;
  onConfirmar: (reservaId: number, motivo: string) => Promise<void>;
}

const OPCOES_MOTIVO = [
  'Desistência do hóspede',
  'No-show (não compareceu)',
  'Erro de lançamento',
  'Outro',
] as const;

export default function ModalCancelamentoReserva({ aberto, dados, onFechar, onConfirmar }: Props) {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>('');
  const [motivoLivre, setMotivoLivre] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!aberto || !dados) return null;

  const motivoFinal = motivoSelecionado === 'Outro' ? motivoLivre.trim() : motivoSelecionado;
  const podeCancelar =
    motivoSelecionado !== '' &&
    (motivoSelecionado !== 'Outro' || motivoLivre.trim().length > 0);

  const handleFechar = () => {
    if (carregando) return;
    setMotivoSelecionado('');
    setMotivoLivre('');
    setErro(null);
    onFechar();
  };

  const handleConfirmar = async () => {
    if (!podeCancelar || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      await onConfirmar(dados.reservaId, motivoFinal);
      setMotivoSelecionado('');
      setMotivoLivre('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao cancelar reserva.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cancel-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleFechar}
      />

      {/* Painel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90dvh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </span>
            <h2
              id="modal-cancel-title"
              className="text-base font-bold text-slate-800"
            >
              Cancelar Reserva
            </h2>
          </div>
          <button
            type="button"
            onClick={handleFechar}
            disabled={carregando}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex flex-col gap-4 p-5">
          {/* Dados da reserva */}
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-rose-800">Dados da reserva a cancelar:</p>
            <p className="text-slate-700">
              <span className="font-medium">Quarto:</span> {dados.quartoNumero}
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Hóspede:</span> {dados.nomeHospede}
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Check-in:</span> {formatarDataBR(dados.dataCheckin)}
            </p>
            <p className="text-slate-700">
              <span className="font-medium">Check-out previsto:</span> {formatarDataBR(dados.dataCheckoutPrevista)}
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Motivo do cancelamento <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {OPCOES_MOTIVO.map((opcao) => (
                <label
                  key={opcao}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    motivoSelecionado === opcao
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="motivo-cancelamento"
                    value={opcao}
                    checked={motivoSelecionado === opcao}
                    onChange={() => setMotivoSelecionado(opcao)}
                    className="accent-rose-600"
                  />
                  <span className="text-sm font-medium">{opcao}</span>
                </label>
              ))}
            </div>

            {/* Campo livre para "Outro" */}
            {motivoSelecionado === 'Outro' && (
              <textarea
                value={motivoLivre}
                onChange={(e) => setMotivoLivre(e.target.value)}
                placeholder="Descreva o motivo..."
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 resize-none"
              />
            )}
          </div>

          {/* Erro */}
          {erro && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {erro}
            </p>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 p-5 pt-0">
          <button
            type="button"
            onClick={handleFechar}
            disabled={carregando}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 active:scale-[0.98]"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!podeCancelar || carregando}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar cancelamento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
