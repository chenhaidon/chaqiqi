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

## 腾讯云服务器一键部署

推荐部署目标：**腾讯云 CVM / 轻量应用服务器（Ubuntu 22.04）**。

当前项目使用 SQLite 本地文件 `data/app.db` 存储评论、缓存和账号数据，因此推荐使用：
- Node.js 20
- PM2 托管 `next start`
- Nginx 反向代理
- 宿主机持久化 `data/` 目录

### 1. 准备服务器

先把域名解析到腾讯云服务器，并确保安全组已放行：
- `22`（SSH）
- `80`（HTTP）
- `443`（HTTPS）

然后把仓库放到服务器，例如：

```bash
git clone <你的仓库地址> /srv/chaqiqi
cd /srv/chaqiqi
```

### 2. 初始化服务器环境

项目已自带初始化脚本：

```bash
APP_DIR=/srv/chaqiqi DOMAIN=your-domain.com bash scripts/setup-server.sh
```

这个脚本会：
- 安装 Node.js 20
- 安装 PM2
- 安装 Nginx
- 写入并启用站点配置

如需安装 HTTPS 证书工具：

```bash
APP_DIR=/srv/chaqiqi DOMAIN=your-domain.com INSTALL_CERTBOT=true bash scripts/setup-server.sh
```

之后可执行：

```bash
sudo certbot --nginx -d your-domain.com
```

### 3. 配置生产环境变量

复制生产示例文件：

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

### 4. 一键部署应用

执行：

```bash
APP_DIR=/srv/chaqiqi bash scripts/deploy.sh
```

这个脚本会自动：
- 校验 Node / npm / PM2
- 校验 `.env.production`
- 创建 `data/` 目录
- 安装依赖 `npm ci`
- 执行 `npm run build`
- 用 PM2 启动或重载应用
- 本机健康检查 `http://127.0.0.1:3000`

### 5. 常用运维命令

```bash
pm2 status
pm2 logs chaqiqi
pm2 restart chaqiqi
pm2 save
curl http://127.0.0.1:3000
sudo nginx -t
sudo systemctl reload nginx
```

### 6. 更新部署

服务器上拉取新代码后，重新执行：

```bash
cd /srv/chaqiqi
git pull
APP_DIR=/srv/chaqiqi bash scripts/deploy.sh
```

### 7. SQLite 数据备份

数据库文件位于：

```bash
data/app.db
```

由于启用了 WAL 模式，备份时建议一并处理相关文件：
- `data/app.db`
- `data/app.db-wal`
- `data/app.db-shm`

简单备份示例：

```bash
tar -czf chaqiqi-data-backup.tar.gz data/
```

## 字段映射说明

企查查不同套餐返回的字段命名可能不同。数据映射集中在
[src/lib/qccProvider.ts](src/lib/qccProvider.ts) 的 `mapToCompany` 函数,
以及 `qccSearch` / `qccDetail` 的接口路径。若你的账号返回结构不一致,
**只需调整这一个文件**,上层 UI 与 API 路由无需改动。

鉴权采用企查查标准方式:`Token = MD5(key + timespan + secretKey)`,
随请求头 `Token`、`Timespan` 发送。

## 目录结构

```
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
