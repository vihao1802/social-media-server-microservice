import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { UserService } from 'src/user/user.service';

@Global()
@Module({
  providers: [DatabaseService, UserService],
  exports: [DatabaseService],
})
export class DatabaseModule { }
