#!/usr/bin/env bash
# Deploy lên server "zone" (~/.ssh/config):
#   - web tĩnh (Vue, apps/web/dist) -> /srv/nguoi-que      (nginx phục vụ tại https://zone-c.io.vn/nguoi-que/)
#   - máy chủ online + Postgres (Docker) -> /srv/nguoi-que-online, cổng 127.0.0.1:3070
#     (nginx chuyển /nguoi-que/ws và /nguoi-que/api/ vào, xem nginx-nguoi-que.conf)
# Lần đầu: tạo /srv/nguoi-que-online/.env có POSTGRES_PASSWORD (và GOOGLE_CLIENT_ID nếu có).
# Chuyển dữ liệu bản cũ (ví xu, tài khoản JSON) sang Postgres, chạy một lần sau khi deploy:
#   ssh zone 'cd /srv/nguoi-que-online && docker compose exec nguoi-que-online ./node_modules/.bin/tsx scripts/import-json.ts'
set -euo pipefail
cd "$(dirname "$0")"
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @nguoi-que/web build

rsync -az --delete apps/web/dist/ zone:/srv/nguoi-que/
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .git --exclude .env --exclude apps/web --exclude data \
  ./ zone:/srv/nguoi-que-online/
ssh zone 'chown -R root:root /srv/nguoi-que && cd /srv/nguoi-que-online && docker compose up -d --build && sleep 5 && curl -fsS http://127.0.0.1:3070/health'
echo
echo "Đã deploy: https://zone-c.io.vn/nguoi-que/"
