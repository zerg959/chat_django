# Stage 1: Build Vue app
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Caddy
FROM caddy:2-alpine AS production-stage

# Копируем собранные файлы Vue
COPY --from=build-stage /app/dist /usr/share/caddy

# Копируем Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]