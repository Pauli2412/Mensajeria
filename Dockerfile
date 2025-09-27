# Imagen base oficial de Node.js
FROM node:18

# Crear directorio de la app
WORKDIR /app

# Copiar package.json y package-lock.json primero (mejora cache)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Generar cliente de Prisma
RUN npx prisma generate

# Exponer puerto de la app
EXPOSE 5010

# Comando de arranque
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
