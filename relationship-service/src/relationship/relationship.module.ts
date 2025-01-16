import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { DatabaseCLient } from './database/prisma-client.db';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [RelationshipController],
  providers: [RelationshipService, DatabaseCLient],
})
export class RelationshipModule {}
