import type {
  CheckinPayload,
  EditarHospedagemPayload,
  HistoricoPage,
  HospedagemResponse,
  LoginResponse,
  QuartoMapa,
  QuartoRequest,
  RelatorioVacancia,
  RenovarDiariaPayload,
  ReservaItem,
  ReservaPayload,
  StatusQuarto,
  UsuarioResumo
} from '../types';

const TOKEN_KEY = 'pousada_jwt_token';
const USER_KEY = 'pousada_user_data';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  `http://${window.location.hostname}:8080/api`;

export function salvarSessao(token: string, usuario: UsuarioResumo): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function limparSessao(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function obterTokenSalvo(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function obterUsuarioSalvo(): UsuarioResumo | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioResumo;
  } catch {
    return null;
  }
}

async function requisitar<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = obterTokenSalvo();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401 && path !== '/auth/login') {
    limparSessao();
    window.dispatchEvent(new Event('pousada:unauthorized'));
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const mensagem = data?.mensagem || `Erro ${response.status} na comunicação com o servidor.`;
    throw new Error(mensagem);
  }

  return data as T;
}

export const api = {
  login: (login: string, senha: string) =>
    requisitar<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, senha })
    }),

  me: () => requisitar<UsuarioResumo>('/auth/me'),

  listarQuartos: (incluirInativos = false) =>
    requisitar<QuartoMapa[]>(`/quartos?incluirInativos=${incluirInativos}`),

  criarQuarto: (payload: QuartoRequest) =>
    requisitar<QuartoMapa>('/quartos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  atualizarQuarto: (id: number, payload: QuartoRequest) =>
    requisitar<QuartoMapa>(`/quartos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  alterarStatusQuarto: (id: number, novoStatus: StatusQuarto, observacaoAtual?: string | null) =>
    requisitar<QuartoMapa>(`/quartos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ novoStatus, observacaoAtual })
    }),

  atualizarObservacaoQuarto: (id: number, observacaoAtual: string | null) =>
    requisitar<QuartoMapa>(`/quartos/${id}/observacao`, {
      method: 'PATCH',
      body: JSON.stringify({ observacaoAtual })
    }),

  realizarCheckin: (payload: CheckinPayload) =>
    requisitar<HospedagemResponse>('/hospedagens/checkin', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  registrarReserva: (payload: ReservaPayload) =>
    requisitar<HospedagemResponse>('/hospedagens/reserva', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  listarReservas: () => requisitar<ReservaItem[]>('/hospedagens/reservas'),

  listarHistorico: (params: {
    status?: string[];
    quartoId?: number;
    nomeHospede?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.status?.length) params.status.forEach(s => qs.append('status', s));
    if (params.quartoId != null) qs.set('quartoId', String(params.quartoId));
    if (params.nomeHospede) qs.set('nomeHospede', params.nomeHospede);
    if (params.dataInicio) qs.set('dataInicio', params.dataInicio);
    if (params.dataFim) qs.set('dataFim', params.dataFim);
    qs.set('page', String(params.page ?? 0));
    qs.set('size', String(params.size ?? 20));
    return requisitar<HistoricoPage>(`/hospedagens?${qs.toString()}`);
  },

  exportarHistoricoCsv: async (params: {
    status?: string[];
    quartoId?: number;
    nomeHospede?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<void> => {
    const qs = new URLSearchParams();
    if (params.status?.length) params.status.forEach(s => qs.append('status', s));
    if (params.quartoId != null) qs.set('quartoId', String(params.quartoId));
    if (params.nomeHospede) qs.set('nomeHospede', params.nomeHospede);
    if (params.dataInicio) qs.set('dataInicio', params.dataInicio);
    if (params.dataFim) qs.set('dataFim', params.dataFim);

    const token = obterTokenSalvo();
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${API_BASE}/hospedagens/exportar/csv?${qs.toString()}`, {
      headers
    });
    if (!res.ok) {
      throw new Error(`Erro ${res.status} ao exportar arquivo.`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historico-hospedagens-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  cancelarReserva: (hospedagemId: number) =>
    requisitar<HospedagemResponse>(`/hospedagens/${hospedagemId}/cancelar`, {
      method: 'POST'
    }),

  realizarCheckout: (quartoId: number, valorPagoCheckout?: number, observacaoLimpeza?: string) =>
    requisitar<HospedagemResponse>(`/quartos/${quartoId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ valorPagoCheckout, observacaoLimpeza })
    }),

  estornarHospedagem: (hospedagemId: number, motivo: string) =>
    requisitar<HospedagemResponse>(`/hospedagens/${hospedagemId}/estornar`, {
      method: 'POST',
      body: JSON.stringify({ motivo })
    }),

  renovarDiarias: (hospedagemId: number, payload: RenovarDiariaPayload) =>
    requisitar<HospedagemResponse>(`/hospedagens/${hospedagemId}/renovar`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),

  editarHospedagem: (hospedagemId: number, payload: EditarHospedagemPayload) =>
    requisitar<HospedagemResponse>(`/hospedagens/${hospedagemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  relatorioVacancia: (dataInicio: string, dataFim: string) =>
    requisitar<RelatorioVacancia>(
      `/relatorios/vacancia?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}`
    )
};
