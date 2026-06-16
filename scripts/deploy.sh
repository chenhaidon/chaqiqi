#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/chaqiqi}"
APP_NAME="${APP_NAME:-chaqiqi}"
PORT="${PORT:-3000}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "缺少命令: $1" >&2
    exit 1
  }
}

require_cmd node
require_cmd npm
require_cmd pm2
require_cmd curl

if [ ! -d "$APP_DIR" ]; then
  echo "应用目录不存在: $APP_DIR" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "缺少环境变量文件: $ENV_FILE" >&2
  exit 1
fi

cd "$APP_DIR"
mkdir -p data

export $(grep -v '^#' "$ENV_FILE" | xargs)

for key in DATA_PROVIDER APP_BASE_URL; do
  if [ -z "${!key:-}" ]; then
    echo "环境变量未设置: $key" >&2
    exit 1
  fi
done

npm ci
npm run build
pm2 startOrReload ecosystem.config.js --update-env
curl -fsS "http://127.0.0.1:${PORT}" >/dev/null

echo "部署成功: ${APP_NAME} 已运行在 http://127.0.0.1:${PORT}"
echo "查看状态: pm2 status ${APP_NAME}"
echo "查看日志: pm2 logs ${APP_NAME}"
