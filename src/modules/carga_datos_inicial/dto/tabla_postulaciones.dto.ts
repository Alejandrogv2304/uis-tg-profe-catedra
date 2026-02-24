import { PostulacionEstado } from "src/modules/postulaciones/entities/postulaciones.entity";


export type PostulacionTableDto = {
  postulacionId: string;
  convocatoriaId: string;
  aspiranteId: string;

  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;

  correo: string;
  telefono: string;

  sede: string;
  perfil: string;

  areaDesempenoId: string;
  areaDesempenoNombre: string;

  estado: PostulacionEstado;
};