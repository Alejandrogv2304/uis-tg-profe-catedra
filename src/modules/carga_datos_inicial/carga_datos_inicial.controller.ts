import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CargaDatosInicialService } from './carga_datos_inicial.service';

@Controller('api/carga-datos-inicial')
export class CargaDatosInicialController {
     constructor(private readonly service: CargaDatosInicialService) {}

  @Post(':convocatoriaId')
  @UseInterceptors(FileInterceptor('file'))
  async importUisard(
    @Param('convocatoriaId', new ParseUUIDPipe({ version: '4' })) convocatoriaId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({ message: 'Debe adjuntar un archivo en el campo "file".' });
    }

    const name = file.originalname?.toLowerCase() ?? '';
    if (!name.endsWith('.xlsx')) {
      throw new BadRequestException({ message: 'Formato inválido. Solo se admite .xlsx' });
    }

    // buffer del archivo (multer memory storage por defecto en muchos setups)
    return this.service.importUisard(convocatoriaId, file.buffer);
  }
}
