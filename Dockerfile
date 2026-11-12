FROM node:22 AS fe
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-17 AS be
WORKDIR /be
COPY backend/pom.xml .
COPY backend/src ./src
COPY --from=fe /fe/dist/portfolio/browser ./src/main/resources/static
RUN mvn -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=be /be/target/portfolio-1.0.0.jar app.jar
ENV PORT=8080
CMD ["sh", "-c", "java -Xmx350m -jar app.jar --server.port=${PORT}"]
