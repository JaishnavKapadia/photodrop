# backend/Dockerfile

# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Generate the Prisma Client files inside the container
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/prisma ./prisma 

RUN npm install --omit=dev

RUN npx prisma generate

EXPOSE 3001
CMD [ "node", "dist/index.js" ]