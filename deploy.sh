#!/usr/bin/env bash
# Deploy lên server "zone" (~/.ssh/config):
#   - web tĩnh  -> /srv/nguoi-que           (nginx phục vụ tại https://zone-c.io.vn/nguoi-que/)
#   - máy chủ online (Docker) -> /srv/nguoi-que-online, cổng 127.0.0.1:3070 (nginx proxy /nguoi-que/ws)
set -euo pipefail
cd "$(dirname "$0")"
npm test
npm run build

rsync -az --delete dist/ zone:/srv/nguoi-que/
rsync -az --delete --exclude node_modules \
  Dockerfile docker-compose.yml .dockerignore package.json package-lock.json dist-server \
  zone:/srv/nguoi-que-online/
ssh zone 'chown -R root:root /srv/nguoi-que && cd /srv/nguoi-que-online && docker compose up -d --build && sleep 2 && curl -fsS http://127.0.0.1:3070/health'
echo
echo "Đã deploy: https://zone-c.io.vn/nguoi-que/"
