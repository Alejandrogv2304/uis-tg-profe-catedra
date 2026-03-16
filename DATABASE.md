# 🐘 Configuración de PostgreSQL con Docker

## 📋 Requisitos previos

- Docker Desktop instalado y corriendo
- Node.js instalado

## ⚡ Configuración inicial (primera vez)

```bash
# 1. Crear red y volumen
docker network create uis-scpc-network
docker volume create uis-scpc-postgres-data

# 2. Levantar PostgreSQL
docker run -d --name uis-scpc-postgres --network uis-scpc-network --restart unless-stopped -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=uis_scpc_db -p 5432:5432 -v uis-scpc-postgres-data:/var/lib/postgresql/data postgres:17-alpine

# 3. Verificar
docker ps

# 4. Instalar e iniciar la aplicación
npm install
npm run start:dev
```

**Siguientes veces:**
```bash
docker start uis-scpc-postgres
npm run start:dev
```

## � Credenciales por defecto

- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Contraseña: `postgres123`
- Base de datos: `uis_scpc_db`

## 🔧 Comandos útiles

```bash
docker ps                              # Ver contenedores activos
docker logs -f uis-scpc-postgres       # Ver logs en tiempo real
docker stop uis-scpc-postgres          # Detener PostgreSQL
docker start uis-scpc-postgres         # Iniciar PostgreSQL
docker restart uis-scpc-postgres       # Reiniciar PostgreSQL
docker exec -it uis-scpc-postgres psql -U postgres -d uis_scpc_db  # Acceder a consola PostgreSQL
```

## 🐳 Correr backend en Docker (opcional)

```bash
# 1. Construir imagen
docker build -t uis-scpc-profe-catedra .

# 2. Correr contenedor
docker run -d --name uis-scpc-app --network uis-scpc-network --env-file .env -e DB_HOST=uis-scpc-postgres -p 3000:3000 uis-scpc-profe-catedra

# 3. Ver logs
docker logs -f uis-scpc-app
```

**⚠️ Nota:** Cuando el backend corre en Docker, usar `DB_HOST=uis-scpc-postgres` en lugar de `localhost`.

## 🧹 Limpieza completa

```bash
# Detener y eliminar todo (⚠️ BORRA TODOS LOS DATOS)
docker stop uis-scpc-postgres uis-scpc-app
docker rm uis-scpc-postgres uis-scpc-app
docker volume rm uis-scpc-postgres-data
docker network rm uis-scpc-network
```

## ⚠️ Troubleshooting

### Error: "port 5432 is already allocated"
Detén el PostgreSQL local o usa otro puerto:
```bash
# Usar puerto 5433
docker run -d --name uis-scpc-postgres --network uis-scpc-network -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=uis_scpc_db -p 5433:5432 -v uis-scpc-postgres-data:/var/lib/postgresql/data postgres:17-alpine
```
Actualizar `.env`: `DB_PORT=5433`

### Error: "network/volume already exists"
Ya existe, continúa con el siguiente paso.

### Ver qué está corriendo
```bash
docker ps                    # Contenedores activos
docker ps -a                 # Todos los contenedores
docker volume ls             # Volúmenes
docker network ls            # Redes
```

## 🌍 Despliegue en producción

```bash
# En el servidor
docker network create uis-scpc-network
docker volume create uis-scpc-postgres-data

# Levantar BD
docker run -d --name uis-scpc-postgres --network uis-scpc-network --restart always -e POSTGRES_USER=tu_usuario -e POSTGRES_PASSWORD=tu_password_segura -e POSTGRES_DB=uis_scpc_db -p 5432:5432 -v uis-scpc-postgres-data:/var/lib/postgresql/data postgres:17-alpine

# Levantar backend
docker build -t uis-scpc-profe-catedra .
docker run -d --name uis-scpc-app --network uis-scpc-network --env-file .env -e DB_HOST=uis-scpc-postgres -e NODE_ENV=production -p 3000:3000 uis-scpc-profe-catedra
```

**⚠️ Importante en producción:**
- Usar contraseñas seguras
- `synchronize: false` en TypeORM (usar migraciones)
- Configurar backups automáticos

## 📚 Recursos

- [NestJS + TypeORM](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Docs](https://www.postgresql.org/docs/17/)
- [TypeORM Docs](https://typeorm.io/)
