FROM node:18

WORKDIR /app

# Copiar los archivos de dependencias e instalar con npm
COPY package.json package-lock.json* ./
RUN npm install

# Copiar el código fuente completo
COPY . .

# Exponer el puerto de React (CRA)
EXPOSE 3000

# Ejecutar en modo desarrollo
CMD ["npm", "start"]
