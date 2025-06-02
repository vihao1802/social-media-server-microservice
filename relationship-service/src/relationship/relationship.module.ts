import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';
import { DatabaseCLient } from './database/prisma-client.db';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'notification',
            brokers: ['localhost:9094'],
          },
          consumer: {
            groupId: 'notification-group',
          },
        },
      },
    ]),
  ],
  controllers: [RelationshipController],
  providers: [RelationshipService, DatabaseCLient],
})
export class RelationshipModule {}
