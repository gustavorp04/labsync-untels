FROM node:18

WORKDIR /app

# Aumentar memoria disponible para npm (React 19 + CRA tiene árbol de deps muy grande)
ENV NODE_OPTIONS=--max-old-space-size=4096

# Instalar dependencias primero (capa cacheada si package.json no cambia)
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copiar código fuente
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
