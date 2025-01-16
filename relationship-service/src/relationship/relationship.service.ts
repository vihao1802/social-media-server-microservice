import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseCLient } from './database/prisma-client.db';
import { HttpService } from '@nestjs/axios';
import { Prisma, Relationship } from '@prisma/client';
import { RelationshipStatus, RelationshipType } from './enum/relationship.enum';
import { User } from './types/user';
import { firstValueFrom } from 'rxjs';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class RelationshipService {
  private readonly logger = new Logger(RelationshipService.name);

  constructor(
    private readonly databaseClient: DatabaseCLient,
    private readonly httpService: HttpService,
  ) {}
  async GetUserFollowingList(userId: string, paginationDto: PaginationDto) {
    await this.CheckUserExist(userId);
    if (
      paginationDto.orderBy !== '' ||
      !(paginationDto.orderBy in Prisma.RelationshipScalarFieldEnum)
    ) {
      throw new BadRequestException(
        `${paginationDto.orderBy} is not a valid field`,
      );
    }
    const skip = (paginationDto.page - 1) * paginationDto.pageSize || 0;
    const take = paginationDto.pageSize || 5;
    try {
      const [following, total] = await Promise.all([
        this.databaseClient.relationship.findMany({
          skip,
          take,
          omit: {
            SenderId: true,
            Type: true,
          },
          where: {
            SenderId: userId,
            Status: RelationshipStatus.ACCEPTED,
          },

          orderBy: [
            paginationDto.orderBy
              ? {
                  [paginationDto.orderBy]:
                    (paginationDto.sort as Prisma.SortOrder) ||
                    Prisma.SortOrder.asc,
                }
              : {
                  Id:
                    (paginationDto.sort as Prisma.SortOrder) ||
                    Prisma.SortOrder.asc,
                },
          ],
        }),
        this.databaseClient.relationship.count({
          where: {
            ReceiverId: userId,
          },
        }),
      ]);
      return {
        total,
        page: paginationDto.page || 1,
        pageSize: paginationDto.pageSize || 5,
        totalPage: Math.ceil(total / (paginationDto.pageSize || 5)),
        data: following,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async GetUserFollowerList(userId: string, paginationDto: PaginationDto) {
    await this.CheckUserExist(userId);
    if (
      paginationDto.orderBy !== '' ||
      !(paginationDto.orderBy in Prisma.RelationshipScalarFieldEnum)
    ) {
      throw new BadRequestException(
        `${paginationDto.orderBy} is not a valid field`,
      );
    }
    const skip = (paginationDto.page - 1) * paginationDto.pageSize || 0;
    const take = paginationDto.pageSize || 5;
    try {
      const [following, total] = await Promise.all([
        this.databaseClient.relationship.findMany({
          skip,
          take,
          omit: {
            ReceiverId: true,
            Type: true,
          },
          where: {
            ReceiverId: userId,
            Status: RelationshipStatus.ACCEPTED,
          },

          orderBy: [
            paginationDto.orderBy
              ? {
                  [paginationDto.orderBy]:
                    (paginationDto.sort as Prisma.SortOrder) ||
                    Prisma.SortOrder.asc,
                }
              : {
                  Id:
                    (paginationDto.sort as Prisma.SortOrder) ||
                    Prisma.SortOrder.asc,
                },
          ],
        }),
        this.databaseClient.relationship.count({
          where: {
            ReceiverId: userId,
          },
        }),
      ]);
      return {
        total,
        page: paginationDto.page || 1,
        pageSize: paginationDto.pageSize || 5,
        totalPage: Math.ceil(total / (paginationDto.pageSize || 5)),
        data: following,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async FollowUser(senderId: string, receiverId: string) {
    const user: any = await this.CheckUserExist(receiverId);
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        receiverId,
      );

      if (relationship) {
        if (relationship.Status === 'accepted') {
          throw new Error('Already following');
        }
        if (relationship.Status === 'pending') {
          throw new Error('Request wait for acceptance');
        }
        if (relationship.Type === RelationshipType.BLOCK) {
          throw new Error('You are blocked');
        }
      }
      const relationship_receiver: Relationship = await this.GetRelationship(
        receiverId,
        senderId,
      );
      const approval =
        relationship_receiver.Type === RelationshipType.FOLLOW &&
        relationship_receiver.Status === 'accepted' &&
        !user.isPrivateAccount;

      await this.databaseClient.relationship.create({
        data: {
          SenderId: senderId,
          ReceiverId: receiverId,
          Status: approval
            ? RelationshipStatus.ACCEPTED
            : RelationshipStatus.PENDING,
          Type: RelationshipType.FOLLOW,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async UnFollowUser(senderId: string, receiverId: string) {
    const user: any = await this.CheckUserExist(receiverId);
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        receiverId,
      );

      if (relationship) {
        if (relationship.Type === RelationshipType.BLOCK) {
          throw new Error('You are blocked by this user');
        }
      }

      await this.databaseClient.relationship.delete({
        where: {
          Id: relationship.Id,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
  async AcceptUserFollowRequest(senderId: string, receiverId: string) {
    const user: any = await this.CheckUserExist(senderId);
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        receiverId,
      );

      if (relationship) {
        if (relationship.Type === RelationshipType.BLOCK)
          throw new Error('You are blocked by this user');
        if (relationship.Status === RelationshipStatus.ACCEPTED) return;
      }

      await this.databaseClient.relationship.update({
        where: {
          Id: relationship.Id,
        },
        data: {
          Status: RelationshipStatus.ACCEPTED,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
  async RejectUserFollowRequest(senderId: string, receiverId: string) {
    await this.CheckUserExist(senderId);
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        receiverId,
      );
      if (!relationship) return;

      if (relationship.Type === RelationshipType.BLOCK)
        throw new Error('You are blocked by this user');

      await this.databaseClient.relationship.delete({
        where: {
          Id: relationship.Id,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async GetRelationship(senderId: string, receiverId: string) {
    try {
      return await this.databaseClient.relationship.findFirst({
        where: {
          SenderId: senderId,
          ReceiverId: receiverId,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  async GetMyBlockList(userId: string) {
    await this.CheckUserExist(userId);
    try {
      return await this.databaseClient.relationship.findMany({
        where: {
          SenderId: userId,
          Type: RelationshipType.BLOCK,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  async BlockUser(senderId: string, receiverId: string) {
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        receiverId,
      );
      if (relationship) {
        if (relationship.Type === RelationshipType.BLOCK) return;
        if (relationship.Type === RelationshipType.FOLLOW) {
          await this.databaseClient.relationship.update({
            where: {
              Id: relationship.Id,
            },
            data: {
              Type: RelationshipType.BLOCK,
              Status: RelationshipStatus.ACCEPTED,
            },
          });
          return;
        }
      }
      await this.databaseClient.relationship.create({
        data: {
          SenderId: senderId,
          ReceiverId: receiverId,
          Type: RelationshipType.BLOCK,
          Status: RelationshipStatus.ACCEPTED,
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async UnblockerUser(senderId: string, receiverId: string) {
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        receiverId,
      );
      if (relationship) {
        if (relationship.Type === RelationshipType.BLOCK) {
          await this.databaseClient.relationship.delete({
            where: {
              Id: relationship.Id,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  private async CheckUserExist(userId: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${process.env.USER_SERVICE_URL}/user/${userId}`),
      );
      if (!res.data.data) throw new Error('User not found');

      return res.data.data;
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
