FROM node:18

WORKDIR /app

# Usar Yarn en lugar de NPM para evitar los OOM (Out Of Memory)
# al resolver los conflictos de dependencias entre React 19 y CRA 5.
COPY package.json yarn.lock* ./
RUN yarn install

# Copiar el código fuente completo
COPY . .

# Exponer el puerto de React (CRA)
EXPOSE 3000

# Ejecutar en modo desarrollo
CMD ["npm", "start"]
