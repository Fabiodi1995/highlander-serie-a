# Multi-stage build per ottimizzare le dimensioni
FROM node:18-alpine AS builder

WORKDIR /app

# Copia package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia codice sorgente
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build dell'applicazione
RUN npm run build

# Stage produzione
FROM node:18-alpine AS production

WORKDIR /app

# Installa solo dipendenze produzione
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia build files dal builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Crea directories necessarie
RUN mkdir -p uploads logs

# Utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs
RUN adduser -S highlander -u 1001
RUN chown -R highlander:nodejs /app
USER highlander

# Esponi porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Avvia applicazione
CMD ["node", "server/index.js"]