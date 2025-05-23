#!/bin/bash

# Chuyển mvnw sang format UNIX (nếu đang dùng Windows)
dos2unix mvnw

# Chạy Spring Boot app trong nền, mở remote debug ở cổng 5005
./mvnw spring-boot:run &

# Theo dõi thay đổi trong src và compile lại để devtools tự reload
while true; do
  inotifywait -e modify,create,delete,move -r ./src && ./mvnw compile
done
