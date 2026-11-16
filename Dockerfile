# Máy chủ online của Đại Chiến Người Que (chỉ WebSocket, phần web tĩnh do nginx phục vụ)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY dist-server ./dist-server
# Ví xu bắt kèo lưu ở /app/data (gắn volume trong docker-compose để không mất khi deploy lại)
RUN mkdir -p /app/data && chown node:node /app/data
ENV WALLET_FILE=/app/data/wallets.json ACCOUNT_FILE=/app/data/accounts.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist-server/index.js"]
