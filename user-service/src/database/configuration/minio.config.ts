import { registerAs } from '@nestjs/config';

export default registerAs('minioConfig', () => ({
  provide: 'MINIO_CONFIG',
  useValue: {
    url: process.env.MINIO_URL, // MinIO host
    useSSL: false, // Không dùng SSL trong môi trường cục bộ
    accessKeyId: process.env.MINIO_ACCESS_KEY, // Tài khoản root
    secretAccessKey: process.env.MINIO_SECRET_KEY, // Mật khẩu root
    bucketName: process.env.MINIO_BUCKET_NAME, // Tên bucket
    bucketPath: process.env.MINIO_BUCKET_PATH, // đường dẫn bucket
    minioPreviewImageEndpoint: process.env.MINIO_PREVIEW_IMAGE_ENDPOINT, // Tên bucket
  },
}));
