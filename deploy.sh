#!/usr/bin/env bash
# Deploy lên server "zone" (~/.ssh/config):
#   - web tĩnh (Vue, apps/web/dist) -> /srv/stickman-war      (nginx phục vụ tại https://zone-c.io.vn/stickman-war/)
#   - trang admin (Rspack, apps/admin/dist) -> /srv/stickman-war/admin (https://zone-c.io.vn/stickman-war/admin/)
#   - máy chủ online + Postgres (Docker) -> /srv/stickman-war-online, cổng 127.0.0.1:3070
#     (nginx chuyển /stickman-war/ws và /stickman-war/api/ vào, xem nginx-stickman-war.conf)
# Lần đầu: tạo /srv/stickman-war-online/.env có POSTGRES_PASSWORD (và GOOGLE_CLIENT_ID, ADMIN_EMAILS, ADMIN_TOKEN nếu có).
# Chuyển dữ liệu bản cũ (ví xu, tài khoản JSON) sang Postgres, chạy một lần sau khi deploy:
#   ssh zone 'cd /srv/stickman-war-online && docker compose exec stickman-war-online ./node_modules/.bin/tsx scripts/import-json.ts'
set -euo pipefail
cd "$(dirname "$0")"
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @stickman-war/web build
pnpm --filter @stickman-war/admin build

rsync -az --delete --exclude admin/ apps/web/dist/ zone:/srv/stickman-war/
rsync -az --delete apps/admin/dist/ zone:/srv/stickman-war/admin/
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .git --exclude .env --exclude apps/web --exclude apps/admin --exclude data \
  ./ zone:/srv/stickman-war-online/
ssh zone 'chown -R root:root /srv/stickman-war && cd /srv/stickman-war-online && docker compose up -d --build && sleep 5 && curl -fsS http://127.0.0.1:3070/health'
echo
echo "Đã deploy: https://zone-c.io.vn/stickman-war/ (admin: https://zone-c.io.vn/stickman-war/admin/)"
