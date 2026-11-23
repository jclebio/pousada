import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopBar } from './components/layout/TopBar';
import { BottomNav, type AbaAtiva } from './components/layout/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { MapaOperacionalPage } from './pages/MapaOperacionalPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { WhatsAppModal } from './components/common/WhatsAppModal';
import { ModalMeuPerfil } from './components/perfil/ModalMeuPerfil';

const AppShell: React.FC = () => {
  const { usuario, carregandoSessao, isGerente } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('mapa');
  const [sinalAtualizacao, setSinalAtualizacao] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [mensagemWhatsappModal, setMensagemWhatsappModal] = useState<string | null>(null);
  const [ultimaMensagemWhatsapp, setUltimaMensagemWhatsapp] = useState<string | null>(null);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [modalPerfilAbaInicial, setModalPerfilAbaInicial] = useState<'perfil' | 'usuarios'>('perfil');

  const handleNotificarMensagemWhatsapp = (msg: string | null | undefined) => {
    if (msg && msg.trim()) {
      setUltimaMensagemWhatsapp(msg);
      setMensagemWhatsappModal(msg);
    }
  };

  if (carregandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300 text-sm font-semibold">
        Verificando sessão...
      </div>
    );
  }

  if (!usuario) {
    return <LoginPage />;
  }

  const abaEfetiva: AbaAtiva =
    !isGerente && abaAtiva === 'relatorios' ? 'mapa' : abaAtiva;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        atualizando={atualizando}
        onRefresh={() => setSinalAtualizacao((n) => n + 1)}
        temMensagemWhatsapp={Boolean(ultimaMensagemWhatsapp)}
        onAbrirMensagemWhatsapp={() => {
          if (ultimaMensagemWhatsapp) {
            setMensagemWhatsappModal(ultimaMensagemWhatsapp);
          }
        }}
        onAbrirMeuPerfil={(aba) => {
          setModalPerfilAbaInicial(aba || 'perfil');
          setModalPerfilAberto(true);
        }}
      />

      <main>
        {abaEfetiva === 'mapa' ? (
          <MapaOperacionalPage
            sinalAtualizacao={sinalAtualizacao}
            onMudarEstadoCarregamento={setAtualizando}
            onNotificarMensagemWhatsapp={handleNotificarMensagemWhatsapp}
          />
        ) : abaEfetiva === 'historico' ? (
          <HistoricoPage />
        ) : (
          <RelatoriosPage
            sinalAtualizacao={sinalAtualizacao}
            onMudarEstadoCarregamento={setAtualizando}
          />
        )}
      </main>

      <WhatsAppModal
        mensagem={mensagemWhatsappModal}
        onFechar={() => setMensagemWhatsappModal(null)}
      />

      <ModalMeuPerfil
        aberto={modalPerfilAberto}
        onFechar={() => setModalPerfilAberto(false)}
        abaInicial={modalPerfilAbaInicial}
      />

      <BottomNav abaAtiva={abaEfetiva} onSelecionarAba={setAbaAtiva} />
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
