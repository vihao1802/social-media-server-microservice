# Sử dụng Python làm base image
FROM python:3.10-slim

# Cài đặt thư viện cần thiết
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code dự án
COPY . .

# Chạy ứng dụng
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]