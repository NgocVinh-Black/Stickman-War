# Máy chủ online Đại Chiến Người Que: NestJS + WebSocket, dữ liệu trong PostgreSQL (service "db" của docker-compose).
# Web tĩnh (apps/web/dist) do nginx phục vụ, không nằm trong image này.
FROM node:22-alpine
RUN corepack enable
WORKDIR /repo

# Cài phụ thuộc trước (tận dụng cache khi chỉ đổi mã nguồn)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY apps/server/package.json apps/server/
COPY apps/server/prisma apps/server/prisma
RUN pnpm install --frozen-lockfile --filter @nguoi-que/server...

COPY packages/core packages/core
COPY apps/server apps/server
RUN pnpm --filter @nguoi-que/server build && mkdir -p /repo/data && chown -R node:node /repo/data

ENV NODE_ENV=production PORT=3000
WORKDIR /repo/apps/server
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
# Cập nhật bảng (migration) rồi chạy máy chủ
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.cjs"]
