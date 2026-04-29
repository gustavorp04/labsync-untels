FROM node:18-slim

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código
COPY . .

# Exponer el puerto de React (CRA)
EXPOSE 3000

# Ejecutar en modo desarrollo
CMD ["npm", "start"]
