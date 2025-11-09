#!/bin/bash

# 腾讯云部署脚本
# 使用方法：./deploy.sh [服务器IP] [API密钥]

set -e

# 检查参数
if [ "$#" -ne 2 ]; then
    echo "使用方法: ./deploy.sh <服务器IP> <DeepSeek_API_密钥>"
    echo "例如: ./deploy.sh 1.2.3.4 sk-xxxxx"
    exit 1
fi

SERVER_IP=$1
API_KEY=$2
APP_NAME="text-adventure-game"

echo "========================================="
echo "开始部署到腾讯云服务器: $SERVER_IP"
echo "========================================="

# 1. 打包项目
echo "📦 正在打包项目..."
tar -czf ${APP_NAME}.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.env \
    --exclude=*.tar.gz \
    --exclude=.DS_Store \
    .

echo "✅ 项目打包完成"

# 2. 上传到服务器
echo "📤 正在上传到服务器..."
scp ${APP_NAME}.tar.gz root@${SERVER_IP}:/tmp/

echo "✅ 上传完成"

# 3. 在服务器上部署
echo "🚀 正在服务器上部署..."
ssh root@${SERVER_IP} << EOF
    set -e
    
    # 创建应用目录
    mkdir -p /opt/${APP_NAME}
    cd /opt/${APP_NAME}
    
    # 停止旧容器
    echo "🛑 停止旧容器..."
    docker-compose down 2>/dev/null || true
    
    # 解压新代码
    echo "📂 解压代码..."
    tar -xzf /tmp/${APP_NAME}.tar.gz -C /opt/${APP_NAME}/
    rm -f /tmp/${APP_NAME}.tar.gz
    
    # 创建环境变量文件
    echo "⚙️  配置环境变量..."
    cat > .env << ENVEOF
DEEPSEEK_API_KEY=${API_KEY}
PORT=3000
NODE_ENV=production
ENVEOF
    
    # 启动容器
    echo "🐳 启动 Docker 容器..."
    docker-compose up -d --build
    
    # 等待容器启动
    echo "⏳ 等待服务启动..."
    sleep 5
    
    # 检查容器状态
    echo "🔍 检查容器状态..."
    docker-compose ps
    
    # 显示日志
    echo "📋 最近的日志:"
    docker-compose logs --tail=20
    
    echo ""
    echo "========================================="
    echo "✅ 部署完成！"
    echo "========================================="
    echo "访问地址: http://${SERVER_IP}:3000"
    echo ""
    echo "查看日志: ssh root@${SERVER_IP} 'cd /opt/${APP_NAME} && docker-compose logs -f'"
    echo "重启服务: ssh root@${SERVER_IP} 'cd /opt/${APP_NAME} && docker-compose restart'"
    echo "停止服务: ssh root@${SERVER_IP} 'cd /opt/${APP_NAME} && docker-compose down'"
EOF

# 4. 清理本地打包文件
echo "🧹 清理本地临时文件..."
rm -f ${APP_NAME}.tar.gz

echo ""
echo "========================================="
echo "🎉 部署成功！"
echo "========================================="
echo "游戏地址: http://${SERVER_IP}:3000"
echo ""
echo "提示：如果无法访问，请检查："
echo "1. 服务器防火墙是否开放 3000 端口"
echo "2. 腾讯云安全组是否允许 3000 端口入站"
echo ""

