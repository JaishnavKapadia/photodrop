# backend/Dockerfile

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Install OpenSSL (Required for Prisma)
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install
COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN npm run build

# --- Production Stage ---
FROM node:20-alpine
WORKDIR /usr/src/app

# Install OpenSSL
RUN apk add --no-cache openssl

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/prisma ./prisma 
COPY --from=build /usr/src/app/prisma.config.ts ./

RUN npm install --omit=dev

COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001
CMD [ "node", "dist/index.js" ]