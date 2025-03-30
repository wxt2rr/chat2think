# 使用官方的Java 17镜像作为基础镜像
FROM openjdk:17-jdk-slim

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件和源代码
COPY pom.xml .
COPY src ./src

# 安装Maven
RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 编译应用
RUN mvn clean package -DskipTests

# 复制编译后的jar文件
RUN cp target/*.jar app.jar

# 创建上传目录
RUN mkdir -p uploads/images

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["java", "-jar", "app.jar"]