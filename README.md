# 查企企 · 浙江省企业信息查询

一个基于 Next.js 全栈的企业信息查询应用,支持:

- 按**企业名称 / 统一社会信用代码 / 法定代表人**精准与模糊查询
- 查询结果展示企业全称、注册状态、信用代码、法定代表人、注册资本、成立日期、注册地址、经营范围
- 结果翻页浏览
- 企业详情页支持**评论 + 1-5 星打分**
- 查询结果缓存(SQLite),降低对付费接口的重复调用
- 桌面 / 移动端响应式

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 + 后端 | Next.js 14 (App Router) + React 18 + TypeScript |
| 企业数据 | 企查查开放平台 API(可切换为内置示例数据) |
| 评论 / 评分 / 缓存 | SQLite (better-sqlite3),本地文件 `data/app.db` |

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000

默认 `DATA_PROVIDER=mock`,使用内置浙江省示例企业数据,**无需任何凭证即可体验全部功能**。

## 接入企查查真实数据

1. 复制 `.env.example` 为 `.env.local`
2. 填入企查查凭证并切换数据源:

```env
DATA_PROVIDER=qcc
QCC_KEY=你的AppKey
QCC_SECRET_KEY=你的SecretKey
```

3. 重启 `npm run dev`

## Docker Compose 一键部署

推荐部署目标：**腾讯云 CVM / 轻量应用服务器（Ubuntu 22.04）**。

当前项目默认推荐使用 **Docker Compose + Nginx + SQLite 持久卷** 部署。

### 1. 准备服务器

先确保服务器已安装：
- Docker
- Docker Compose Plugin

如果还没安装，可在 Ubuntu 上执行：

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

然后把仓库拉到服务器：

```bash
git clone https://github.com/chenhaidon/chaqiqi.git /srv/chaqiqi
cd /srv/chaqiqi
```

### 2. 配置生产环境变量

复制生产环境变量模板：

```bash
cp .env.production.example .env.production
```

至少填写这些值：

```env
DATA_PROVIDER=qcc
QCC_KEY=你的QCC_APP_KEY
QCC_SECRET_KEY=你的QCC_SECRET
QCC_BASE_URL=https://api.qichacha.com
CACHE_TTL_SECONDS=86400

SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=你的邮箱
SMTP_PASS=你的SMTP授权码
SMTP_FROM=你的邮箱

APP_BASE_URL=https://your-domain.com
ENABLE_QCC_DEBUG_API=false
```

说明：
- `APP_BASE_URL` 必须是正式访问域名，否则注册/重置密码邮件里的链接会指向错误地址
- 生产环境默认不要开启 `ENABLE_QCC_DEBUG_API`
- `.env.production` 不要提交到 Git

### 3. 一键构建并启动

```bash
docker compose build
docker compose up -d
```

启动后：
- `app` 容器运行 Next.js 服务
- `nginx` 容器监听 `80` 端口并反代到 `app:3000`
- `chaqiqi_data` 命名卷负责持久化 `/app/data`

### 4. 常用 Docker 运维命令

```bash
docker compose ps
docker compose logs -f
docker compose logs -f app
docker compose logs -f nginx
docker compose restart
docker compose down
docker compose up -d
```

### 5. 更新部署

```bash
cd /srv/chaqiqi
git pull
docker compose build
docker compose up -d
```

如果要强制重新构建：

```bash
docker compose build --no-cache
docker compose up -d
```

### 6. SQLite 数据持久化说明

数据库位于容器内：

```bash
/app/data/app.db
```

通过 `docker-compose.yml` 中的命名卷 `chaqiqi_data` 持久化。

重要说明：
- `docker compose down` **不会删除数据卷**
- 如果你手动执行 `docker compose down -v`，会连同数据库一起删除
- SQLite 启用了 WAL 模式，相关文件包括：
  - `app.db`
  - `app.db-wal`
  - `app.db-shm`

### 7. 访问验证

启动完成后，直接访问：

```text
http://你的服务器IP
```

如果你已经有域名并解析到服务器，也可以直接访问域名。

### 8. 生产 HTTPS

当前 Docker 版默认先走 HTTP + Nginx 容器反代。

如果你后续要接 HTTPS，建议两种方式二选一：
- 宿主机层处理证书并反代到 Docker
- 继续扩展 Nginx 容器挂载证书文件

## 传统 VM 部署（非 Docker）

如果你不想使用 Docker，也保留了 **Node.js + PM2 + Nginx** 的传统部署方案。

### 1. 准备服务器

先把域名解析到腾讯云服务器，并确保安全组已放行：
- `22`（SSH）
- `80`（HTTP）
- `443`（HTTPS）

然后把仓库放到服务器，例如：

```bash
git clone https://github.com/chenhaidon/chaqiqi.git /srv/chaqiqi
cd /srv/chaqiqi
```

### 2. 初始化服务器环境

项目已自带初始化脚本：

```bash
APP_DIR=/srv/chaqiqi DOMAIN=your-domain.com bash scripts/setup-server.sh
```

### 3. 配置生产环境变量

```bash
cp .env.production.example .env.production
```

填好 QCC / SMTP / `APP_BASE_URL` 等变量后，执行：

```bash
APP_DIR=/srv/chaqiqi bash scripts/deploy.sh
```

### 4. 常用运维命令

```bash
pm2 status
pm2 logs chaqiqi
pm2 restart chaqiqi
pm2 save
curl http://127.0.0.1:3000
sudo nginx -t
sudo systemctl reload nginx
```

## 字段映射说明

企查查不同套餐返回的字段命名可能不同。数据映射集中在
[src/lib/qccProvider.ts](src/lib/qccProvider.ts) 的 `mapToCompany` 函数,
以及 `qccSearch` / `qccDetail` 的接口路径。若你的账号返回结构不一致,
**只需调整这一个文件**,上层 UI 与 API 路由无需改动。

鉴权采用企查查标准方式:`Token = MD5(key + timespan + secretKey)`,
随请求头 `Token`、`Timespan` 发送。

## 目录结构

```text
src/
  app/
    page.tsx                       首页(搜索框)
    search/page.tsx                结果列表(翻页)
    company/[id]/page.tsx          企业详情 + 评论打分
    api/
      search/route.ts              搜索接口
      company/[id]/route.ts        详情接口
      company/[id]/comments/route.ts  评论增/查
    globals.css
  lib/
    types.ts          统一数据模型
    db.ts             SQLite 连接与建表
    cache.ts          查询缓存
    comments.ts       评论 / 评分读写
    mockData.ts       浙江省示例数据
    qccProvider.ts    企查查适配层
    dataProvider.ts   数据源统一入口(mock/qcc 切换 + 缓存)
```

## 数据合规提示

企业工商信息属于公开信息,但通过第三方接口获取需遵守对应平台的服务条款与
《数据安全法》《个人信息保护法》相关规定。请勿将法定代表人等个人信息用于
平台约定范围之外的用途。
