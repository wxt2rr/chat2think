# 使用Node.js作为基础镜像
FROM node:22.14.0

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 安装serve用于生产环境
RUN npm install -g serve

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["serve", "-s", "dist", "-l", "3000"]