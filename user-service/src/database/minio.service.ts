import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import minioConfig from './configuration/minio.config';
import * as crypto from 'crypto';
import { ConfigType } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;
  private readonly bucketPath: string;
  private readonly previewEndpoint: string;
  private readonly logger = new Logger(MinioService.name); 
  constructor(
    @Inject(minioConfig.KEY) private config: ConfigType<typeof minioConfig>,
  ) {
    
    const [endpoint, port] = this.config.useValue.url.split('//')[1].split(':');

    this.minioClient = new Minio.Client({
      endPoint: endpoint,
      port: parseInt(port),
      useSSL: false,
      accessKey: config.useValue.accessKeyId,
      secretKey: config.useValue.secretAccessKey,
    });
    this.bucketName = config.useValue.bucketName;
    this.bucketPath = config.useValue.bucketPath;
    this.previewEndpoint = config.useValue.minioPreviewImageEndpoint;
  }

  async uploadFile(
    fileName: string,
    file: Buffer | Readable,
    fileSize: number,
    contentType: string,
  ) {
    try {
      const checkBucketExisted = await this.minioClient.bucketExists(
        this.bucketName,
      );

      if (!checkBucketExisted) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      }

      const timestamp = Date.now();
      const hash = crypto
        .createHash('sha256')
        .update(fileName + timestamp)
        .digest('hex');
        const key = `${this.bucketPath}/${hash}`;

      await this.minioClient.putObject(this.bucketName, key, file, fileSize, {
        'Content-Type': contentType,
      });

      return `${this.previewEndpoint}/browser/${this.bucketName}%${key}`;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Upload file failed');
    }
  }
}
