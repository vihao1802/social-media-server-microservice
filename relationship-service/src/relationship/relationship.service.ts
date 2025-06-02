import {
  BadRequestException,
  HttpException,
  Inject,
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
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class RelationshipService {
  private readonly logger;

  constructor(
    private readonly databaseClient: DatabaseCLient,
    private readonly httpService: HttpService,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notiService: ClientKafka,
  ) {
    this.logger = new Logger(RelationshipService.name);
  }
  async GetUserFollowingList(
    authorizedUser: User,
    paginationDto: PaginationDto,
    userId?: string,
  ) {
    if (userId) await this.CheckUserExist(userId, authorizedUser.Token);
    if (
      paginationDto.orderBy &&
      !(paginationDto.orderBy in Prisma.RelationshipScalarFieldEnum)
    ) {
      this.logger.error(`400: ${paginationDto.orderBy} is not a valid field`);
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
            SenderId: userId ? userId : authorizedUser.id,
            Status: RelationshipStatus.ACCEPTED,
          },
          include: {
            Receiver: {
              select: {
                id: true,
                username: true,
                profileImg: true,
                email: true,
              },
            },
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
            SenderId: userId ? userId : authorizedUser.id,
          },
        }),
      ]);
      this.logger.log(`200: ${total} records found} `);

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

  async GetUserFollowerList(
    authorizedUser: User,
    paginationDto: PaginationDto,
    userId?: string,
  ) {
    if (userId) await this.CheckUserExist(userId, authorizedUser.Token);
    if (
      paginationDto.orderBy &&
      !(paginationDto.orderBy in Prisma.RelationshipScalarFieldEnum)
    ) {
      this.logger.error(`400: ${paginationDto.orderBy} is not a valid field`);

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
            ReceiverId: userId ? userId : authorizedUser.id,
            Status: RelationshipStatus.ACCEPTED,
          },
          include: {
            Sender: {
              select: {
                id: true,
                username: true,
                profileImg: true,
                email: true,
              },
            },
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
            ReceiverId: userId ? userId : authorizedUser.id,
          },
        }),
      ]);

      this.logger.log(`200: ${total} records found} `);
      return {
        total,
        page: paginationDto.page || 1,
        pageSize: paginationDto.pageSize || 5,
        totalPage: Math.ceil(total / (paginationDto.pageSize || 5)),
        data: following,
      };
    } catch (error) {
      this.logger.error(`500:${error.message}`);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }

  async FollowUser(authorizedUser: User, receiverId: string) {
    const user: any = await this.CheckUserExist(
      receiverId,
      authorizedUser.Token,
    );
    try {
      const relationship: Relationship = await this.GetRelationship(
        authorizedUser.id,
        receiverId,
      );

      if (relationship) {
        if (relationship.Status === RelationshipStatus.ACCEPTED) {
          this.logger.error(`400: Already following`);
          throw new BadRequestException('Already following');
        }
        if (relationship.Status === RelationshipStatus.PENDING) {
          this.logger.error(`400: Request are pending`);
          throw new BadRequestException('Request are pending');
        }
        if (relationship.Type === RelationshipType.BLOCK) {
          this.logger.error(`400: You are blocked`);
          throw new BadRequestException('You are blocked');
        }
      }
      // check if receiver followed sender or not
      const relationship_receiver: Relationship = await this.GetRelationship(
        receiverId,
        authorizedUser.id,
      );

      const approval =
        (relationship_receiver &&
          relationship_receiver.Type === RelationshipType.FOLLOW &&
          relationship_receiver.Status === RelationshipStatus.ACCEPTED) ||
        !user.isPrivateAccount;

      await this.databaseClient.relationship.create({
        data: {
          ReceiverId: receiverId,
          Status: approval
            ? RelationshipStatus.ACCEPTED
            : RelationshipStatus.PENDING,
          Type: RelationshipType.FOLLOW,
          SenderId: authorizedUser.id,
        },
      });

      this.logger.log(`200: User ${authorizedUser.id} followed ${receiverId} `);

      this.notiService.emit('relationship-notification', {
        value: {
          senderId: authorizedUser.id,
          receiverId: receiverId,
          relation: RelationshipType.FOLLOW,
        },
        headers: {
          __TypeId__: 'RelationshipMessage',
        },
      });
    } catch (error: any) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async UnFollowUser(authorizedUser: User, receiverId: string) {
    await this.CheckUserExist(receiverId, authorizedUser.Token);
    try {
      const relationship: Relationship = await this.GetRelationship(
        authorizedUser.id,
        receiverId,
      );

      if (relationship) {
        if (relationship.Type === RelationshipType.BLOCK) {
          this.logger.error(
            `400: ${authorizedUser.id} are blocked by user ${receiverId}`,
          );
          throw new BadRequestException('You are blocked by this user');
        }
      }

      await this.databaseClient.relationship.delete({
        where: {
          Id: relationship.Id,
        },
      });

      this.logger.log(
        `200: User ${authorizedUser.id} unfollowed ${receiverId} `,
      );

      this.notiService.emit('relationship-notification', {
        value: {
          senderId: authorizedUser.id,
          receiverId: receiverId,
          relation: 'unfollow',
        },
        headers: {
          __TypeId__: 'RelationshipMessage',
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
  async AcceptUserFollowRequest(senderId: string, authorizedUser: User) {
    const user: any = await this.CheckUserExist(senderId, authorizedUser.Token);
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        authorizedUser.id,
      );

      if (relationship) {
        if (relationship.Type === RelationshipType.BLOCK) {
          this.logger.error(
            `400: ${authorizedUser.id} are blocked by user ${senderId}`,
          );
          throw new Error('You are blocked by this user');
        }
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
      this.logger.log(
        `200: ${authorizedUser.id} accepted request of ${senderId} `,
      );

      this.notiService.emit('relationship-notification', {
        value: {
          senderId: senderId,
          receiverId: authorizedUser.id,
          relation: 'accept',
        },
        headers: {
          __TypeId__: 'RelationshipMessage',
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
  async RejectUserFollowRequest(senderId: string, authorizedUser: User) {
    await this.CheckUserExist(senderId, authorizedUser.Token);
    try {
      const relationship: Relationship = await this.GetRelationship(
        senderId,
        authorizedUser.id,
      );
      if (!relationship) return;

      if (relationship.Type === RelationshipType.BLOCK) {
        this.logger.error(
          `400: ${authorizedUser.id} are blocked by user ${senderId}`,
        );
        throw new Error('You are blocked by this user');
      }

      await this.databaseClient.relationship.delete({
        where: {
          Id: relationship.Id,
        },
      });
      this.logger.log(
        `200: ${authorizedUser.id} rejected follow request ${senderId} `,
      );

      this.notiService.emit('relationship-notification', {
        value: {
          senderId: senderId,
          receiverId: authorizedUser.id,
          relation: 'reject',
        },
        headers: {
          __TypeId__: 'RelationshipMessage',
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
  async GetMyBlockList(authorizedUser: User, paginationDto: PaginationDto) {
    const skip = (paginationDto.page - 1) * paginationDto.pageSize || 0;
    const take = paginationDto.pageSize || 5;
    try {
      const [blockList, total] = await Promise.all([
        this.databaseClient.relationship.findMany({
          skip,
          take,
          where: {
            SenderId: authorizedUser.id,
            Type: RelationshipType.BLOCK,
          },
        }),
        this.databaseClient.relationship.count({
          where: {
            SenderId: authorizedUser.id,
            Type: RelationshipType.BLOCK,
          },
        }),
      ]);

      this.logger.log(`200: ${total} records found`);

      return {
        total,
        page: paginationDto.page || 1,
        pageSize: paginationDto.pageSize || 5,
        totalPage: Math.ceil(total / (paginationDto.pageSize || 5)),
        data: blockList,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Internal Server Error');
    }
  }
  async BlockUser(authorizedUser: User, receiverId: string) {
    if (receiverId === authorizedUser.id)
      throw new BadRequestException('You cannot block yourself');
    try {
      const relationship: Relationship = await this.GetRelationship(
        authorizedUser.id,
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
          this.logger.log(`200: ${authorizedUser.id} blocked ${receiverId} `);

          this.notiService.emit('relationship-notification', {
            value: {
              senderId: authorizedUser.id,
              receiverId: receiverId,
              relation: 'block',
            },
            headers: {
              __TypeId__: 'RelationshipMessage',
            },
          });
          return;
        }
      }
      await this.databaseClient.relationship.create({
        data: {
          SenderId: authorizedUser.id,
          ReceiverId: receiverId,
          Type: RelationshipType.BLOCK,
          Status: RelationshipStatus.ACCEPTED,
        },
      });

      this.logger.log(`200: ${authorizedUser.id} blocked ${receiverId} `);
      this.notiService.emit('relationship-notification', {
        value: {
          senderId: authorizedUser.id,
          receiverId: receiverId,
          relation: 'block',
        },
        headers: {
          __TypeId__: 'RelationshipMessage',
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async UnblockerUser(authorizedUser: User, receiverId: string) {
    if (receiverId === authorizedUser.id)
      throw new BadRequestException('You cannot unblock yourself');
    try {
      const relationship: Relationship = await this.GetRelationship(
        authorizedUser.id,
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
      this.logger.log(`200: ${authorizedUser.id} unblocked ${receiverId} `);
      this.notiService.emit('relationship-notification', {
        value: {
          senderId: authorizedUser.id,
          receiverId: receiverId,
          relation: 'unblock',
        },
        headers: {
          __TypeId__: 'RelationshipMessage',
        },
      });
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async GetRecommendation(userId: string, paginationDto: PaginationDto) {
    const skip = (paginationDto.page - 1) * paginationDto.pageSize;
    const take = paginationDto.pageSize;

    // get user following
    const friends = await this.databaseClient.relationship.findMany({
      where: {
        SenderId: userId,
        Type: RelationshipType.FOLLOW,
      },
      select: {
        ReceiverId: true, // Chỉ lấy ReceiverId
      },
    });

    const friendIds = friends.map((friend) => friend.ReceiverId);

    // get user follow following
    const [mutuals, totalMutuals] = await Promise.all([
      this.databaseClient.relationship.groupBy({
        skip,
        take,
        by: ['ReceiverId'],
        where: {
          SenderId: { in: friendIds },
          AND: [
            { ReceiverId: { notIn: friendIds } },
            { ReceiverId: { not: userId } },
          ],
          Type: RelationshipType.FOLLOW,
          Status: RelationshipStatus.ACCEPTED,
        },
        _count: {
          SenderId: true,
        },
        orderBy: {
          _count: {
            SenderId: 'desc',
          },
        },
      }),
      this.databaseClient.relationship.count({
        where: {
          SenderId: { in: friendIds },
          AND: [
            { ReceiverId: { notIn: friendIds } },
            { ReceiverId: { not: userId } },
          ],
          Type: RelationshipType.FOLLOW,
          Status: RelationshipStatus.ACCEPTED,
        },
      }),
    ]);

    const [mostFollower, totalMostFollower] = await Promise.all([
      this.databaseClient.relationship.groupBy({
        skip,
        take,
        by: ['ReceiverId'],
        where: {
          SenderId: { not: userId },
          AND: [
            { ReceiverId: { notIn: friendIds } },
            { ReceiverId: { not: userId } },
          ],
          Type: RelationshipType.FOLLOW,
          Status: RelationshipStatus.ACCEPTED,
        },

        _count: {
          SenderId: true,
        },
        orderBy: {
          _count: {
            SenderId: 'asc',
          },
        },
      }),
      this.databaseClient.relationship.count({
        where: {
          SenderId: { not: userId },
          Type: RelationshipType.FOLLOW,
          Status: RelationshipStatus.ACCEPTED,
        },
      }),
    ]);

    // merge array
    const merged = [...mostFollower, ...mutuals];
    // delete duplicate
    const uniqueByReceiverId = Array.from(
      new Map(merged.map((item) => [item.ReceiverId, item])).values(),
    );
    // get more info of user
    const receiverIds = uniqueByReceiverId.map((item) => item.ReceiverId);
    const suggestions = await this.databaseClient.user.findMany({
      where: {
        id: { in: receiverIds },
        isDisabled: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        profileImg: true,
      },
    });

    const result = uniqueByReceiverId.map((item) => {
      const moreInfo = suggestions.find((r) => r.id === item.ReceiverId);
      return {
        mutualFriends: item._count.SenderId,
        ...moreInfo,
      };
    });

    return {
      total: totalMostFollower + totalMutuals,
      page: paginationDto.page || 1,
      pageSize: paginationDto.pageSize || 5,
      totalPage: Math.ceil(
        (totalMostFollower + totalMutuals) / paginationDto.pageSize,
      ),
      data: result,
    };
  }

  private async CheckUserExist(userId: string, bearerToken: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.get(`${process.env.USER_SERVICE_URL}/user/${userId}`, {
          headers: {
            Authorization: bearerToken,
          },
        }),
      );

      if (!res.data) {
        this.logger.error(`400: ${userId} not found`);

        throw new BadRequestException('User not found');
      }

      return res.data;
    } catch (error) {
      throw error;
    }
  }
}
