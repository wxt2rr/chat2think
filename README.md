# Chat2Think

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

Chat2Think 是一个现代化的全栈聊天应用，提供实时通信和智能对话功能。

## 🌟 特性

- 实时聊天功能
- 现代化的用户界面
- 多语言支持（i18n）
- 响应式设计
- 安全的用户认证

## 🛠 技术栈

### 后端
- Java 17
- Spring Boot
- MySQL
- Redis
- WebSocket (STOMP)

### 前端
- React 18
- Material-UI
- Vite
- Zustand (状态管理)
- i18next (国际化)

## 🚀 快速开始

### 使用 Docker Compose

1. 克隆仓库
```bash
git clone https://github.com/yourusername/chat2think.git
cd chat2think
```

2. 启动服务
```bash
docker-compose up -d
```

应用将在以下地址运行：
- 前端：http://localhost:3000
- 后端：http://localhost:8080

### 手动部署

#### 后端
1. 确保已安装 Java 17 和 Maven
2. 构建项目
```bash
mvn clean package
```
3. 运行应用
```bash
java -jar target/*.jar
```

#### 前端
1. 进入前端目录
```bash
cd frontend
```
2. 安装依赖
```bash
npm install
```
3. 启动开发服务器
```bash
npm run dev
```

## 📝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解更多详情。