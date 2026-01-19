# 🐘 Configuración de PostgreSQL con Docker

## 📋 Requisitos previos

- Docker Desktop instalado y corriendo
- Node.js instalado

## 🚀 Inicio rápido

### 1. Levantar la base de datos

```bash
npm run docker:up
```

Esto iniciará:
- **PostgreSQL 17** en `localhost:5432`
- **pgAdmin** (interfaz web) en `http://localhost:5050`

### 2. Verificar que está corriendo

```bash
npm run docker:logs
```

### 3. Iniciar la aplicación NestJS

```bash
npm run start:dev
```

## 🔧 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run docker:up` | Inicia los contenedores en segundo plano |
| `npm run docker:down` | Detiene y elimina los contenedores |
| `npm run docker:logs` | Ver logs en tiempo real |
| `npm run docker:restart` | Reinicia los contenedores |

## 🔐 Credenciales por defecto

### PostgreSQL
- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Contraseña: `postgres123`
- Base de datos: `uis_tg_db`

### pgAdmin (opcional)
- URL: http://localhost:5050
- Email: `admin@admin.com`
- Password: `admin123`

## 📁 Estructura de archivos

```
├── docker-compose.yml    # Configuración de Docker
├── .env                  # Variables de entorno (no subir a git)
├── .env.example          # Plantilla de variables
└── src/
    └── app.module.ts     # Configuración de TypeORM
```

## 🛠️ Crear tu primera entidad

### 1. Crear archivo de entidad

```typescript
// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2. Importar en un módulo

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  // ... tu código
})
export class UsersModule {}
```

### 3. Las tablas se crean automáticamente

En desarrollo, TypeORM crea/actualiza las tablas automáticamente gracias a `synchronize: true`.

⚠️ **IMPORTANTE**: En producción, `synchronize` debe ser `false` y usar migraciones.

## 🗄️ Conectarse a la BD con pgAdmin

1. Abrir http://localhost:5050
2. Login con las credenciales de arriba
3. Add New Server:
   - **General > Name**: `Local PostgreSQL`
   - **Connection > Host**: `postgres` (nombre del servicio en Docker)
   - **Connection > Port**: `5432`
   - **Connection > Username**: `postgres`
   - **Connection > Password**: `postgres123`

## 🔄 Workflow de desarrollo

```bash
# 1. Levantar Docker
npm run docker:up

# 2. Desarrollar
npm run start:dev

# 3. Cuando termines
npm run docker:down
```

## ⚠️ Troubleshooting

### Error: "database does not exist"
```bash
npm run docker:down
npm run docker:up
```

### Ver qué está corriendo
```bash
docker ps
```

### Eliminar todo (incluidos datos)
```bash
docker-compose down -v
```
⚠️ Esto borra todos los datos de la BD.

### Error de puerto ocupado
Si el puerto 5432 ya está en uso, cambia en `docker-compose.yml`:
```yaml
ports:
  - '5433:5432'  # Usar puerto 5433 en tu máquina
```

## 📦 Variables de entorno

### Desarrollo (.env)
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=uis_tg_db
```

### Producción
En el servidor, configura las variables con valores seguros:
- Contraseñas fuertes
- `NODE_ENV=production`
- `synchronize: false` en TypeORM

## 🌍 Desplegar en servidor

Cuando despliegues:

1. **NO uses docker-compose en producción** (usa BD gestionada)
2. Usa servicios como:
   - AWS RDS
   - Digital Ocean Managed Databases
   - Railway
   - Render

3. Configura las variables de entorno en el servidor

4. Usa migraciones en lugar de `synchronize: true`

## 📚 Recursos

- [NestJS + TypeORM](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Docs](https://www.postgresql.org/docs/17/)
- [TypeORM Docs](https://typeorm.io/)
