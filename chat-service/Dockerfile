FROM eclipse-temurin:21 AS build
LABEL authors="Vi Hao"

#---------BUILD-------
# Cài Maven
RUN apt-get update && apt-get install -y maven

WORKDIR /app

COPY pom.xml ./

# Tải dependency trong pom.xml
RUN mvn dependency:go-offline -B

COPY src ./src

# Build project với -DskipTests là bỏ qua các unit test, etc.
RUN mvn clean package -DskipTests
#------------------

#---------RUN-------
#  Lúc run thì dùng image nhỏ gọn hơn
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8101

ENTRYPOINT ["java", "-jar", "app.jar"]
#------------------
