export interface JwtPayload {
  sub: number;
  correo: string;
  permisos: string[];
  nombre: string;
  rol: string;
  iat?: number;
  exp?: number;
}
