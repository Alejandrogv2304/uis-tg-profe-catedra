import ExcelJS from 'exceljs';
import { BadRequestException } from '@nestjs/common';
import { excelRowError, isEmail, norm, normKey } from './normalizacion';
import { PostulacionEstado } from 'src/modules/postulaciones/entities/postulaciones.entity';

export type UisardParsedRow = {
  rowNumber: number;

  tipoDocumento: string;
  numeroDocumento: string;

  nombre: string; 
  correo: string;
  telefono: string;

  sede: string;
  perfil: string;

  areaNombre: string;
  estado: PostulacionEstado;

  // se setean luego
  areaId?: string;
};

const REQUIRED_HEADERS = {
  tipoDocumento: ['tipo de documento', 'tipo documento', 'tipodocumento'],
  numeroDocumento: ['numero documento', 'número documento', 'documento', 'nro documento', 'nro_documento'],
  nombre: ['nombres y apellidos', 'nombre', 'nombres', 'nombre completo'],
  correo: ['correo personal', 'correo', 'email', 'e-mail', 'mail'],
  telefono: ['telefono celular', 'teléfono celular', 'telefono', 'teléfono', 'celular'],
  sede: ['sede'],
  areaNombre: ['area desempeño', 'área desempeño', 'area de desempeño', 'área de desempeño', 'area desempeño '],
  cumple: ['cumple'],
  perfil: ['perfil', 'n° perfil', 'n perfil', 'no perfil', 'numero perfil'],
};

type HeaderIndexMap = {
  tipoDocumento: number;
  numeroDocumento: number;
  nombre: number;
  correo: number;
  telefono: number;
  sede: number;
  areaNombre: number;
  cumple: number;
  perfil: number;
};

function resolveHeaderIndexes(headerRowValues: unknown[]): HeaderIndexMap {
  // headerRowValues es 1-indexado cuando viene de exceljs (row.values)
  const idxByNormHeader = new Map<string, number>();
  for (let i = 1; i < headerRowValues.length; i++) {
    const h = normKey(headerRowValues[i]);
    if (h) idxByNormHeader.set(h, i);
  }

  const pick = (key: keyof typeof REQUIRED_HEADERS): number => {
    for (const alias of REQUIRED_HEADERS[key]) {
      const idx = idxByNormHeader.get(normKey(alias));
      if (idx) return idx;
    }
    return -1;
  };

  const map: HeaderIndexMap = {
    tipoDocumento: pick('tipoDocumento'),
    numeroDocumento: pick('numeroDocumento'),
    nombre: pick('nombre'),
    correo: pick('correo'),
    telefono: pick('telefono'),
    sede: pick('sede'),
    areaNombre: pick('areaNombre'),
    cumple: pick('cumple'),
    perfil: pick('perfil'),
  };

  const missing = Object.entries(map)
    .filter(([, v]) => v === -1)
    .map(([k]) => k);

  if (missing.length) {
    throw new BadRequestException({
      message: 'Formato UISARD inválido: faltan columnas requeridas',
      missing,
    });
  }

  return map;
}

function cellToString(v: any): string {
  // exceljs puede dar {text:...} o number, etc.
  if (v == null) return '';
  if (typeof v === 'object') {
    if ('text' in v && typeof v.text === 'string') return v.text;
    if ('result' in v) return String(v.result ?? '');
  }
  return String(v);
}

export async function parseUisardExcel(buffer: Buffer): Promise<UisardParsedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new BadRequestException({ message: 'El archivo Excel no contiene hojas.' });
  }

  const headerRow = sheet.getRow(1);
  const headerMap = resolveHeaderIndexes(headerRow.values as unknown[]);

  const rows: UisardParsedRow[] = [];

  // empieza en fila 2 (datos)
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);

    // si la fila está completamente vacía, saltar
    const rawAll = row.values as any[];
    const hasAny = rawAll.some((x, idx) => idx > 0 && norm(cellToString(x)) !== '');
    if (!hasAny) continue;

    const tipoDocumento = norm(cellToString(row.getCell(headerMap.tipoDocumento).value));
    const numeroDocumento = norm(cellToString(row.getCell(headerMap.numeroDocumento).value));
    const nombre = norm(cellToString(row.getCell(headerMap.nombre).value));
    const correo = norm(cellToString(row.getCell(headerMap.correo).value)).toLowerCase();
    const telefono = norm(cellToString(row.getCell(headerMap.telefono).value));
    const sede = norm(cellToString(row.getCell(headerMap.sede).value));
    const areaNombre = norm(cellToString(row.getCell(headerMap.areaNombre).value));
    const cumpleRaw = normKey(cellToString(row.getCell(headerMap.cumple).value));
    const perfil = norm(cellToString(row.getCell(headerMap.perfil).value));

    const documentoDisplay = `${tipoDocumento} ${numeroDocumento}`.trim();

    // Validaciones requeridas (fail-fast por la primera que encuentre)
    if (!tipoDocumento) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Tipo de documento', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!numeroDocumento) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Número documento', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!nombre) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Nombres y apellidos', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!correo) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Correo personal', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!isEmail(correo)) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Correo personal', documento: documentoDisplay, reason: `Correo inválido: '${correo}'.` }));
    }
    if (!telefono) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Teléfono celular', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!sede) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Sede', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!areaNombre) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Área desempeño', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }
    if (!perfil) {
      throw new BadRequestException(excelRowError({ row: r, field: 'Perfil', documento: documentoDisplay, reason: 'Campo requerido vacío.' }));
    }

    const estado =
      cumpleRaw === 'cumple'
        ? PostulacionEstado.SEGUNDA_ETAPA
        : PostulacionEstado.PRIMERA_ETAPA;

    rows.push({
      rowNumber: r,
      tipoDocumento,
      numeroDocumento,
      nombre,
      correo,
      telefono,
      sede,
      perfil,
      areaNombre,
      estado,
    });
  }

  if (!rows.length) {
    throw new BadRequestException({ message: 'El archivo no contiene filas válidas para importar.' });
  }

  return rows;
}