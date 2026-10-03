# Multi-stage build: giai đoạn build có devDependencies (tsc, prisma), image chạy
# thật chỉ giữ production dependencies + chạy bằng user không phải root.

FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY prisma ./prisma
# Prisma CLI (migrate deploy) nằm trong devDependencies nên cài riêng đúng bản
RUN npm i --no-save prisma@6.19.3 && npx prisma generate
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
