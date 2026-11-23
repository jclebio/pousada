import React, { useEffect, useState } from 'react';
import { Check, Copy, MessageSquare, X } from 'lucide-react';

interface WhatsAppModalProps {
  mensagem: string | null;
  onFechar: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ mensagem, onFechar }) => {
  const [textoEditado, setTextoEditado] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (mensagem) {
      setTextoEditado(mensagem);
      setCopiado(false);
    }
  }, [mensagem]);

  if (!mensagem) {
    return null;
  }

  const handleCopiar = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textoEditado);
      } else {
        // Fallback para navegadores sem API de clipboard ou contextos HTTP não seguros
        const textArea = document.createElement('textarea');
        textArea.value = textoEditado;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar texto:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Mensagem para Equipe (WhatsApp)
              </h2>
              <p className="text-xs text-slate-500">
                Pronta para copiar e colar no grupo do WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Textarea editável */}
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          <label className="block text-xs font-bold uppercase text-slate-500">
            Texto da Mensagem (editável)
          </label>
          <textarea
            value={textoEditado}
            onChange={(e) => setTextoEditado(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm font-mono text-slate-800 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none transition resize-none leading-relaxed"
            placeholder="Mensagem do WhatsApp..."
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2.5 pt-1 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="min-h-[46px] px-4 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleCopiar}
            className={`min-h-[46px] flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md active:scale-[0.98] transition ${
              copiado
                ? 'bg-emerald-700 ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {copiado ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Mensagem</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
