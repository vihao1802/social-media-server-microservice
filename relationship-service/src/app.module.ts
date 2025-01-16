import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RelationshipModule } from './relationship/relationship.module';

@Module({
  imports: [RelationshipModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
