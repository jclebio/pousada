export type PerfilUsuario = 'GERENTE' | 'ATENDENTE';

export type StatusQuarto =
  | 'DISPONIVEL'
  | 'RESERVADO'
  | 'OCUPADO'
  | 'AGUARDANDO_LIMPEZA'
  | 'EM_LIMPEZA'
  | 'EM_MANUTENCAO';

export type StatusHospedagem =
  | 'ATIVA'
  | 'FINALIZADA'
  | 'ESTORNADA'
  | 'RESERVADA'
  | 'CANCELADA';

export interface UsuarioResumo {
  id: number;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioResumo;
}

export interface HospedagemResumoMapa {
  id: number;
  nomeHospede: string;
  quantidadePessoas: number;
  dataCheckin: string;
  quantidadeDiarias: number;
  dataCheckoutPrevista: string;
  statusHospedagem: StatusHospedagem;
  valorTotal: number;
  valorAntecipado: number;
  valorPagoCheckin: number;
  saldoAReceber: number;
  registradoPor: string | null;
}

export interface ReservaItem {
  id: number;
  quartoId: number;
  numeroQuarto: string;
  nomeHospede: string;
  quantidadePessoas: number;
  dataCheckin: string;
  quantidadeDiarias: number;
  dataCheckoutPrevista: string;
  dataCheckoutReal?: string | null;
  statusHospedagem: StatusHospedagem;
  valorTotal: number;
  valorAntecipado: number;
  valorPagoCheckin: number;
  valorPagoCheckout: number;
  totalRecebido: number;
  saldoAReceber: number;
  registradoPor: string | null;
  mensagemWhatsapp?: string | null;
}

export type HospedagemResponse = ReservaItem;

export interface HistoricoPage {
  content: ReservaItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export interface QuartoMapa {
  id: number;
  numero: string;
  descricao: string | null;
  capacidadeMaxima: number;
  diariaPadrao: number | null;
  status: StatusQuarto;
  observacaoAtual: string | null;
  ativo: boolean;
  dataCriacao: string;
  atualizadoEm: string;
  hospedagemAtual: HospedagemResumoMapa | null;
  proximaReserva?: HospedagemResumoMapa | null;
  mensagemWhatsapp?: string | null;
}

export interface QuartoRequest {
  numero: string;
  descricao?: string | null;
  capacidadeMaxima?: number;
  diariaPadrao?: number | null;
  ativo?: boolean;
  dataCriacao?: string;
}

export interface CheckinPayload {
  quartoId: number;
  reservaId?: number;
  nomeHospede: string;
  quantidadePessoas: number;
  dataCheckin: string;
  quantidadeDiarias: number;
  valorPagoCheckin: number;
  valorAntecipado?: number;
  valorTotal?: number;
  observacaoQuarto?: string;
}

export interface ReservaPayload {
  quartoId: number;
  nomeHospede: string;
  quantidadePessoas: number;
  dataCheckin: string;
  quantidadeDiarias: number;
  valorTotal: number;
  valorAntecipado?: number;
  observacaoQuarto?: string;
}

export interface RenovarDiariaPayload {
  diariasAdicionais: number;
  valorAdicional: number;
  valorPagoAgora?: number;
  observacao?: string;
}

export interface EditarHospedagemPayload {
  nomeHospede: string;
  quantidadePessoas: number;
  valorTotal: number;
  valorPagoCheckin?: number;
  motivo: string;
}

export interface DesempenhoQuarto {
  quartoId: number;
  numeroQuarto: string;
  descricao: string | null;
  ativo: boolean;
  diariasDisponiveis: number;
  diariasOcupadas: number;
  diariasVagas: number;
  taxaVacanciaPercentual: number;
  taxaOcupacaoPercentual: number;
  faturamentoRecebido: number;
  faturamentoAReceber: number;
  faturamentoTotal: number;
}

export interface DisponibilidadeDiaria {
  data: string;
  totalQuartosElegiveis: number;
  totalOcupados: number;
  totalVagos: number;
  quartosVagos: string[];
}

export interface RelatorioVacancia {
  dataInicio: string;
  dataFim: string;
  quantidadeDiasPeriodo: number;
  totalDiariasDisponiveis: number;
  totalDiariasOcupadas: number;
  totalDiariasVagas: number;
  taxaVacanciaPercentual: number;
  taxaOcupacaoPercentual: number;
  faturamentoRecebido: number;
  faturamentoAReceber: number;
  faturamentoTotal: number;
  diariaMedia: number;
  desempenhoPorQuarto: DesempenhoQuarto[];
  disponibilidadeDiaria: DisponibilidadeDiaria[];
}
