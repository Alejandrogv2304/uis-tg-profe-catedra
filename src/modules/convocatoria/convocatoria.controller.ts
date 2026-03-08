import { Controller, Get } from '@nestjs/common';
import { ConvocatoriaService } from './convocatoria.service';

@Controller('api/convocatoria')
export class ConvocatoriaController {
    constructor(private readonly service: ConvocatoriaService) {}

    @Get()
    async getAllConvocatorias(){
        return this.service.findAllConvocatorias();
    }
}
