import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GlobalExceptionFilter } from './exception-handler/exception-handler.filter';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RoleModule } from './role/role.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    RoleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
