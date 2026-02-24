
export function norm(s: unknown): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normKey(s: unknown): string {
  return norm(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 
    .replace(/\s+/g, ' ')
    .trim();
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function docKey(tipo: string, numero: string): string {
  return `${tipo}::${numero}`;
}

export function excelRowError(args: {
  message?: string;
  row: number;
  field: string;
  documento?: string;
  reason: string;
}) {
  return {
    message: args.message ?? 'Error en carga UISARD',
    error: {
      row: args.row,
      field: args.field,
      documento: args.documento ?? null,
      reason: args.reason,
    },
  };
}