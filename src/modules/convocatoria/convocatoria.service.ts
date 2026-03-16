import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConvocatoriaEntity } from './entities/convocatoria.entity';
import { ConvocatoriaResponseDto } from './dto/convocatoria_response.dto';

@Injectable()
export class ConvocatoriaService {
    constructor(
        @InjectRepository(ConvocatoriaEntity)
        private readonly convocatoriaRepository: Repository<ConvocatoriaEntity>
    ) {}


    async findAllConvocatorias():Promise<ConvocatoriaResponseDto[]>{

        const convocatorias = await this.convocatoriaRepository.find();

        if(!convocatorias || convocatorias.length === 0){
            return [];
        }

        return convocatorias.map((convocatoria) => ({
            id: convocatoria.id,
            periodo: convocatoria.periodo,
            escuela: convocatoria.escuela
        }));

    }
}
