import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { AspiranteEntity } from '../aspirantes/entities/aspirantes.entity';
import { PostulacionEntity } from '../postulaciones/entities/postulaciones.entity';
import { AreaDesempenoEntity } from '../area_desempeño/entities/area_desempeño.entity';
import { parseUisardExcel, UisardParsedRow } from './utilidades/parser';
import { docKey, excelRowError, normKey } from './utilidades/normalizacion';
import { PostulacionTableDto } from './dto/tabla_postulaciones.dto';

@Injectable()
export class CargaDatosInicialService {
     constructor(private readonly dataSource: DataSource) {}

  async importUisard(convocatoriaId: string, fileBuffer: Buffer): Promise<PostulacionTableDto[]> {
    // 1) Parse + validación (fail-fast)
    const rows = await parseUisardExcel(fileBuffer);

    // 2) Duplicados internos del Excel (por documento+perfil+sede)
    this.ensureNoInternalDuplicates(rows);

    // 3) Resolver areas_desempeño por nombre
    await this.resolveAreas(rows);

    // 4) Persistencia transaccional
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      const aspiranteRepo = runner.manager.getRepository(AspiranteEntity);
      const postulacionRepo = runner.manager.getRepository(PostulacionEntity);

      // 4.1) Insertar aspirantes faltantes (idempotente con orIgnore)
      const aspirantesToInsert = rows.map(r => ({
        tipoDocumento: r.tipoDocumento,
        numeroDocumento: r.numeroDocumento,
        nombre: r.nombre,
        correo: r.correo,
        telefono: r.telefono,
      }));

      // Inserta todos; los repetidos por unique se ignoran
      await runner.manager
        .createQueryBuilder()
        .insert()
        .into(AspiranteEntity)
        .values(aspirantesToInsert)
        .orIgnore()
        .execute();

      // 4.2) Traer IDs de aspirantes para mapear (Postgres: join con jsonb_to_recordset)
      const uniqueDocs = this.uniqueDocs(rows);
      const docPairs = uniqueDocs.map(d => ({ tipo_documento: d.tipoDocumento, numero_documento: d.numeroDocumento }));

      const aspirantes: Array<{ id: string; tipo_documento: string; numero_documento: string }> =
        await runner.manager.query(
          `
          SELECT a.id, a.tipo_documento, a.numero_documento
          FROM aspirantes a
          JOIN jsonb_to_recordset($1::jsonb) AS x(tipo_documento text, numero_documento text)
            ON a.tipo_documento = x.tipo_documento AND a.numero_documento = x.numero_documento
          `,
          [JSON.stringify(docPairs)],
        );

      const aspiranteIdByDoc = new Map<string, string>();
      for (const a of aspirantes) {
        aspiranteIdByDoc.set(docKey(a.tipo_documento, a.numero_documento), a.id);
      }

      // sanity check (si algo raro pasó con inserts)
      for (const r of rows) {
        const id = aspiranteIdByDoc.get(docKey(r.tipoDocumento, r.numeroDocumento));
        if (!id) {
          throw new BadRequestException(
            excelRowError({
              row: r.rowNumber,
              field: 'Aspirante',
              documento: `${r.tipoDocumento} ${r.numeroDocumento}`,
              reason: 'No fue posible resolver el ID del aspirante tras la inserción.',
            }),
          );
        }
      }

      // 4.3) Validar duplicados en BD (misma convocatoria + aspirante + perfil + sede, deletedAt null)
      const aspiranteIds = rows.map(r => aspiranteIdByDoc.get(docKey(r.tipoDocumento, r.numeroDocumento))!);

      const existing = await postulacionRepo.find({
        where: {
          convocatoriaId,
          aspiranteId: In(aspiranteIds),
          deletedAt: IsNull(),
        },
        select: ['aspiranteId', 'perfil', 'sede'],
      });

      const existingSet = new Set(existing.map(p => `${p.aspiranteId}::${normKey(p.perfil)}::${normKey(p.sede)}`));

      for (const r of rows) {
        const aspId = aspiranteIdByDoc.get(docKey(r.tipoDocumento, r.numeroDocumento))!;
        const k = `${aspId}::${normKey(r.perfil)}::${normKey(r.sede)}`;
        if (existingSet.has(k)) {
          throw new BadRequestException(
            excelRowError({
              row: r.rowNumber,
              field: 'Postulación',
              documento: `${r.tipoDocumento} ${r.numeroDocumento}`,
              reason: `Ya existe una postulación para esta convocatoria con el mismo perfil y sede (perfil='${r.perfil}', sede='${r.sede}').`,
            }),
          );
        }
      }

      // 4.4) Insertar postulaciones (si quieres que falle por constraint también, NO uses orIgnore)
      const postulacionesToInsert = rows.map(r => ({
        convocatoriaId,
        aspiranteId: aspiranteIdByDoc.get(docKey(r.tipoDocumento, r.numeroDocumento))!,
        perfil: r.perfil,
        sede: r.sede,
        correo: r.correo,
        telefono: r.telefono,
        areaDesempenoId: r.areaId!,
        estado: r.estado,
        deletedAt: null,
      }));

      await runner.manager
        .createQueryBuilder()
        .insert()
        .into(PostulacionEntity)
        .values(postulacionesToInsert)
        .execute();

      await runner.commitTransaction();

    } catch (e) {
      if (runner.isTransactionActive) {
        await runner.rollbackTransaction();
      }
      throw e;
    } finally {
      await runner.release();
    }

    // 5) Respuesta: listado para tabla (fuera del try para no mezclar con el rollback)
    return await this.fetchPostulacionesTable(convocatoriaId);
  }

  private async resolveAreas(rows: UisardParsedRow[]): Promise<void> {
    const areaRepo = this.dataSource.getRepository(AreaDesempenoEntity);
    const areas = await areaRepo.find({ select: ['id', 'nombre'] });

    const map = new Map<string, { id: string; nombre: string }>();
    for (const a of areas) {
      map.set(normKey(a.nombre), a);
    }

    for (const r of rows) {
      const found = map.get(normKey(r.areaNombre));
      if (!found) {
        throw new BadRequestException(
          excelRowError({
            row: r.rowNumber,
            field: 'Área desempeño',
            documento: `${r.tipoDocumento} ${r.numeroDocumento}`,
            reason: `Área no existe en catálogo: '${r.areaNombre}'.`,
          }),
        );
      }
      r.areaId = found.id;
    }
  }

  private uniqueDocs(rows: UisardParsedRow[]) {
    const set = new Set<string>();
    const out: Array<{ tipoDocumento: string; numeroDocumento: string }> = [];
    for (const r of rows) {
      const k = docKey(r.tipoDocumento, r.numeroDocumento);
      if (!set.has(k)) {
        set.add(k);
        out.push({ tipoDocumento: r.tipoDocumento, numeroDocumento: r.numeroDocumento });
      }
    }
    return out;
  }

  private ensureNoInternalDuplicates(rows: UisardParsedRow[]): void {
    // Dedupe por documento+perfil+sede dentro del archivo
    const seen = new Map<string, number>(); // key -> rowNumber (primera aparición)
    for (const r of rows) {
      const k = `${docKey(r.tipoDocumento, r.numeroDocumento)}::${normKey(r.perfil)}::${normKey(r.sede)}`;
      const firstRow = seen.get(k);
      if (firstRow) {
        throw new BadRequestException(
          excelRowError({
            row: r.rowNumber,
            field: 'Postulación',
            documento: `${r.tipoDocumento} ${r.numeroDocumento}`,
            reason: `Postulación duplicada dentro del archivo (perfil='${r.perfil}', sede='${r.sede}'). Filas: ${firstRow} y ${r.rowNumber}.`,
          }),
        );
      }
      seen.set(k, r.rowNumber);
    }
  }

  private async fetchPostulacionesTable(convocatoriaId: string): Promise<PostulacionTableDto[]> {
    // raw query con joins (evita depender de relaciones si no las tienes mapeadas)
    const rows = await this.dataSource.query(
      `
      SELECT
        p.id as "postulacionId",
        p.convocatoria_id as "convocatoriaId",
        p.aspirante_id as "aspiranteId",
        a.nombre as "nombre",
        a.tipo_documento as "tipoDocumento",
        a.numero_documento as "numeroDocumento",
        p.correo as "correo",
        p.telefono as "telefono",
        p.sede as "sede",
        p.perfil as "perfil",
        p.area_desempeno_id as "areaDesempenoId",
        ad.nombre as "areaDesempenoNombre",
        p.estado as "estado"
      FROM postulaciones p
      JOIN aspirantes a ON a.id = p.aspirante_id
      JOIN areas_desempeño ad ON ad.id = p.area_desempeno_id
      WHERE p.convocatoria_id = $1
        AND p.deletedat IS NULL
      ORDER BY a.numero_documento ASC, p.perfil ASC
      `,
      [convocatoriaId],
    );

    return rows as PostulacionTableDto[];
  }
}
