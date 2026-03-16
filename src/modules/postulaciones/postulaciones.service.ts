import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostulacionEntity } from './entities/postulaciones.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { PostulacionTableDto } from '../carga_datos_inicial/dto/tabla_postulaciones.dto';

@Injectable()
export class PostulacionesService {
     private readonly logger = new Logger(PostulacionesService.name);
    constructor(
        @InjectRepository(PostulacionEntity)
         private readonly postulacionesRepository: Repository<PostulacionEntity>
    ) {}


    async findAllPostulacionesByConvocatoriaId(convocatoriaId:string):Promise<PostulacionTableDto[]>{
         
        try{
        //Obtengo las postulaciones por convocatoria 
    
      const postulaciones = await this.postulacionesRepository
      .createQueryBuilder('p')
      .leftJoin('p.aspirante', 'a')
      .leftJoin('p.areaDesempeno', 'ad')
      .select([
        'p.id AS "postulacionId"',
        'p.convocatoriaId AS "convocatoriaId"',
        'p.estado AS "estado"',
        'p.perfil AS "perfil"',
        'p.telefono AS "telefono"',
        'p.correo AS "correo"',
        'p.sede AS "sede"',
        'p.aspiranteId AS "aspiranteId"',
        'p.areaDesempenoId AS "areaDesempenoId"',

        'a.nombre AS "nombre"',
        'a.numeroDocumento AS "numeroDocumento"',
        'a.tipoDocumento AS "tipoDocumento"',

        'ad.nombre AS "areaDesempenoNombre"',
       
      ])
      .where('p.convocatoriaId = :convocatoriaId', { convocatoriaId })
      .andWhere('p.deletedAt is null')
      .orderBy('p.correo', 'ASC')
      .getRawMany<PostulacionTableDto>();

      if (!postulaciones.length) {
        throw new NotFoundException(
          `No se encontraron postulaciones para la convocatoria ${convocatoriaId}`,
        );
      }

      return postulaciones;

        }catch (error) {
      this.logger.error(
        `Error consultando postulaciones de la convocatoria ${convocatoriaId}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException(
          'Ocurrió un error al consultar la base de datos',
        );
      }

      throw new InternalServerErrorException(
        'Ocurrió un error inesperado al obtener las postulaciones',
      );
    }



       

       

        
    }
}
