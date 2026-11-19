const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export function formatarMoeda(valor: number | null | undefined): string {
  return brlFormatter.format(valor ?? 0);
}

export function hojeISO(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function somarDiasISO(dataISO: string, dias: number): string {
  if (!dataISO || Number.isNaN(dias)) return '';
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  if (!ano || !mes || !dia) return '';
  const dt = new Date(ano, mes - 1, dia);
  dt.setDate(dt.getDate() + dias);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatarDataBR(dataISO: string | null | undefined, curto = false): string {
  if (!dataISO) return '-';
  const [ano, mes, dia] = dataISO.split('-');
  if (!ano || !mes || !dia) return dataISO;
  return curto ? `${dia}/${mes}` : `${dia}/${mes}/${ano}`;
}

export function formatarDiaSemanaCurto(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const dt = new Date(ano, mes - 1, dia);
  return dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

export function parseValorDecimal(input: string): number {
  if (!input) return 0;
  const normalizado = input.replace(',', '.').replace(/[^0-9.-]/g, '');
  const n = Number.parseFloat(normalizado);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
