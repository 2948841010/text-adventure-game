# 🗡️ 暗影地牢 - 文字冒险游戏

基于 AI 驱动的文字冒险游戏，支持多难度模式，使用 DeepSeek API 生成动态剧情。

## 📋 功能特性

- 🤖 AI 驱动的动态剧情生成
- 🎮 三种难度模式（简单、普通、困难）
- ❤️ HP 系统和战斗机制
- 🎒 物品收集和使用系统
- 📊 实时状态追踪和进度显示
- 🎨 精美的 UI 界面

## 🚀 快速开始

### 方式一：本地开发运行

#### 1. 安装依赖
```bash
npm install
```

#### 2. 配置环境变量
创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 DeepSeek API 密钥：
```env
DEEPSEEK_API_KEY=your-api-key-here
PORT=3000
```

> 💡 在 [DeepSeek 平台](https://platform.deepseek.com/) 获取 API 密钥

#### 3. 启动开发服务器
```bash
npm run dev
```

#### 4. 访问游戏
打开浏览器访问：http://localhost:3000

### 方式二：Docker 部署（推荐用于生产环境）

#### 1. 准备环境变量
创建 `.env` 文件并填入你的 API 密钥：
```env
DEEPSEEK_API_KEY=your-api-key-here
```

#### 2. 使用 Docker Compose 启动
```bash
docker-compose up -d
```

#### 3. 查看日志
```bash
docker-compose logs -f
```

#### 4. 停止服务
```bash
docker-compose down
```

### 方式三：直接使用 Docker 命令

#### 1. 构建镜像
```bash
docker build -t text-adventure-game .
```

#### 2. 运行容器
```bash
docker run -d \
  --name text-adventure-game \
  -p 3000:3000 \
  -e DEEPSEEK_API_KEY=your-api-key-here \
  --restart unless-stopped \
  text-adventure-game
```

#### 3. 查看日志
```bash
docker logs -f text-adventure-game
```

## 🌐 腾讯云部署指南

### 使用腾讯云轻量应用服务器

#### 1. 购买服务器
- 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
- 选择轻量应用服务器
- 选择 Ubuntu 20.04 或 CentOS 镜像

#### 2. 安装 Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 3. 上传代码
```bash
# 在本地打包
tar -czf text-adventure-game.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env \
  .

# 使用 scp 上传到服务器
scp text-adventure-game.tar.gz root@your-server-ip:/root/

# 在服务器上解压
ssh root@your-server-ip
cd /root
mkdir -p text-adventure-game
tar -xzf text-adventure-game.tar.gz -C text-adventure-game
cd text-adventure-game
```

#### 4. 配置环境变量
```bash
cat > .env << EOF
DEEPSEEK_API_KEY=your-api-key-here
EOF
```

#### 5. 启动服务
```bash
docker-compose up -d
```

#### 6. 配置防火墙
```bash
# 开放 3000 端口
sudo ufw allow 3000/tcp
```

#### 7. 配置 Nginx 反向代理（可选）

安装 Nginx：
```bash
sudo apt update
sudo apt install nginx -y
```

创建 Nginx 配置：
```bash
sudo nano /etc/nginx/sites-available/text-adventure-game
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/text-adventure-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 8. 配置 SSL（推荐）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

### 使用腾讯云容器服务（TKE）

1. 登录腾讯云控制台
2. 进入容器镜像服务（TCR）
3. 创建镜像仓库
4. 推送镜像：
```bash
# 登录腾讯云镜像仓库
docker login ccr.ccs.tencentyun.com --username=your-username

# 标记镜像
docker tag text-adventure-game ccr.ccs.tencentyun.com/your-namespace/text-adventure-game:latest

# 推送镜像
docker push ccr.ccs.tencentyun.com/your-namespace/text-adventure-game:latest
```

5. 在 TKE 中创建服务，选择刚才推送的镜像

## 🛠️ 可用命令

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 使用 Docker Compose
docker-compose up -d      # 启动服务
docker-compose down       # 停止服务
docker-compose logs -f    # 查看日志
docker-compose restart    # 重启服务
```

## 📦 项目结构

```
text-adventure-game/
├── api/
│   └── index.js          # Express 服务器 + API 路由
├── public/
│   ├── index.html        # 前端页面
│   ├── script.js         # 前端逻辑
│   └── style.css         # 样式文件
├── Dockerfile            # Docker 镜像配置
├── docker-compose.yml    # Docker Compose 配置
├── .dockerignore         # Docker 忽略文件
├── .env.example          # 环境变量示例
├── .gitignore           # Git 忽略文件
├── package.json         # Node.js 依赖配置
└── README.md            # 项目文档
```

## 🔧 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 是 | - |
| `PORT` | 服务器端口 | 否 | 3000 |
| `NODE_ENV` | 运行环境 | 否 | production |

## 🐛 故障排查

### 1. API 调用失败
- 检查 `.env` 文件中的 `DEEPSEEK_API_KEY` 是否正确
- 确认 DeepSeek API 密钥有效且有足够的额度
- 查看服务器日志：`docker-compose logs -f`

### 2. 端口被占用
- 修改 `.env` 文件中的 `PORT` 变量
- 或修改 `docker-compose.yml` 中的端口映射

### 3. Docker 构建失败
- 确保已安装 Docker 和 Docker Compose
- 检查网络连接，确保能访问 Docker Hub
- 尝试清理 Docker 缓存：`docker system prune -a`

### 4. 无法访问游戏
- 检查防火墙是否开放了对应端口
- 确认 Docker 容器正在运行：`docker ps`
- 查看容器日志：`docker logs text-adventure-game`

## 📝 开发说明

### 本地开发
1. 修改代码后，服务器需要手动重启
2. 建议使用 `nodemon` 实现热重载：
```bash
npm install -g nodemon
nodemon api/index.js
```

### API 接口
- `POST /api/chat` - 游戏对话接口
  - 请求体：`{ history: [], difficulty: 'normal' }`
  - 响应：`{ reply: '...' }`

## 📄 许可证

ISC

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请提交 Issue。

---

Made with ❤️ using Node.js, Express, and DeepSeek AI

