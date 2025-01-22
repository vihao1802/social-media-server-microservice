import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { UserService } from 'src/user/user.service';
import { ConfigModule } from '@nestjs/config';
import minioConfig from './configuration/minio.config';
import { MinioService } from './minio.service';

@Global()
@Module({
  imports: [ConfigModule.forFeature(minioConfig)],
  providers: [DatabaseService, UserService, MinioService],
  exports: [DatabaseService, MinioService],
})
export class DatabaseModule {}
