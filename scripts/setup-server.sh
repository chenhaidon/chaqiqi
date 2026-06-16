#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/chaqiqi}"
SITE_NAME="${SITE_NAME:-chaqiqi}"
DOMAIN="${DOMAIN:-your-domain.com}"
INSTALL_CERTBOT="${INSTALL_CERTBOT:-false}"

sudo apt update
sudo apt install -y nginx curl ca-certificates gnupg

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

sudo mkdir -p "$APP_DIR"

TMP_CONF="$(mktemp)"
sed "s/your-domain.com/${DOMAIN}/g" "$APP_DIR/deploy/chaqiqi.nginx.conf" > "$TMP_CONF"
sudo cp "$TMP_CONF" "/etc/nginx/sites-available/${SITE_NAME}"
rm -f "$TMP_CONF"

sudo ln -sf "/etc/nginx/sites-available/${SITE_NAME}" "/etc/nginx/sites-enabled/${SITE_NAME}"
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

if [ "$INSTALL_CERTBOT" = "true" ]; then
  sudo apt install -y certbot python3-certbot-nginx
  echo "已安装 certbot，可执行: sudo certbot --nginx -d ${DOMAIN}"
fi

echo "服务器初始化完成"
echo "Node 版本: $(node -v)"
echo "NPM 版本: $(npm -v)"
echo "PM2 版本: $(pm2 -v | tail -n 1)"
