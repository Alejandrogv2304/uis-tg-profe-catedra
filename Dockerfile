
FROM node:22-alpine AS builder

WORKDIR /app


COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalamos dependencias para ci 
RUN npm ci

# Código fuente y compilación
COPY src/ ./src/
RUN npm run build


FROM node:22-alpine AS production

WORKDIR /app


COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
