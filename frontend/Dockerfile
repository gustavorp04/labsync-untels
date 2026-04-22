FROM node:18-slim

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Ejecutar en modo desarrollo permitiendo conexiones externas
CMD ["npm", "run", "dev", "--", "--host"]
