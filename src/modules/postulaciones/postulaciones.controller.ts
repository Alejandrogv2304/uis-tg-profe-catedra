import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';

@Controller('api/postulaciones')
export class PostulacionesController {
    constructor(private readonly service: PostulacionesService){}

    @Get(':convocatoriaId')
    async getAllPostulacionesByConvocatoriaId(
        @Param('convocatoriaId', new ParseUUIDPipe({ version: '4' })) convocatoriaId: string,
    ){

        return this.service.findAllPostulacionesByConvocatoriaId(convocatoriaId);
    }
}
