FROM node:20-alpine AS web-builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx expo export -p web


FROM node:20-alpine AS backend-builder
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-builder /app/dist ./dist
COPY backend/prisma ./prisma
COPY --from=web-builder /app/dist ./public-web

EXPOSE 4000
CMD ["node", "dist/index.js"]
