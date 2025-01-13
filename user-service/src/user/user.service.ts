import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UserResponseDTO } from './dto/userResponse.dto';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { CreateUserDTO } from './dto/create-user.dto';
import { ErrorCodes } from 'src/exception-handler/error-code.constant';
import { BadRequestException } from 'src/exception-handler/bad-request.exception';
import * as bcrypt from 'bcrypt';
import { InternalServerException } from 'src/exception-handler/internal-server.exception';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { RoleService } from 'src/role/role.service';
import { UserResponse } from './types/user-response';
import { excludeFields } from 'src/utils/helper.util';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}
  async findMany(paginationDto: PaginationDto) {
    const skip = (paginationDto.page - 1) * paginationDto.pageSize || 0;
    const take = paginationDto.pageSize || 5;

    const [users, total] = await Promise.all([
      this.databaseService.user.findMany({
        skip,
        take,
        include: {
          role: {
            select: {
              roleName: true,
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
                id:
                  (paginationDto.sort as Prisma.SortOrder) ||
                  Prisma.SortOrder.asc,
              },
        ],
        where: paginationDto?.usernameOrEmail
          ? {
              OR: [
                {
                  email: {
                    contains: paginationDto?.usernameOrEmail,
                  },
                },
                {
                  username: {
                    contains: paginationDto?.usernameOrEmail,
                  },
                },
              ],
            }
          : {},
      }),
      this.databaseService.user.count({
        where: paginationDto?.usernameOrEmail
          ? {
              OR: [
                {
                  email: {
                    contains: paginationDto?.usernameOrEmail,
                  },
                },
                {
                  username: {
                    contains: paginationDto?.usernameOrEmail,
                  },
                },
              ],
            }
          : {},
      }),
    ]);
    return {
      total,
      page: paginationDto.page || 1,
      pageSize: paginationDto.pageSize || 5,
      totalPage: Math.ceil(total / (paginationDto.pageSize || 5)),
      data: excludeFields(users, ['hashedPassword']),
    };
  }

  async findOne(id: string) {
    try {
      const { hashedPassword, ...userWithoutPassword } =
        await this.databaseService.user.findUnique({
          where: {
            id: id,
          },
          include: {
            role: {
              select: {
                roleName: true,
              },
            },
          },
        });
      return userWithoutPassword;
    } catch (error) {
      console.error(error);
      throw new InternalServerException(
        ErrorCodes.InternalServerErrorCode.INTERNAL_SERVER_ERROR,
        error.message,
      );
    }
  }

  async findByEmail(
    email: string,
  ): Promise<User & { role: { roleName: string } }> {
    return await this.databaseService.user.findFirst({
      where: {
        email: email,
      },
      include: {
        role: true,
      },
    });
  }

  async createUser(createUserDTO: CreateUserDTO) {
    const userExists = await this.findByEmail(createUserDTO.email);

    if (userExists)
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.RESOURCE_ALREADY_EXISTS,
        'Email already exists',
      );
    try {
      const encodedPassword = await this.hashedData(createUserDTO.password);

      const { hashedPassword, ...userWithoutPass } =
        await this.databaseService.user.create({
          data: {
            email: createUserDTO.email,
            hashedPassword: encodedPassword,
            username: createUserDTO.username,
            profileImg: createUserDTO?.profilePicture,
            DateOfBirth: createUserDTO.dob,
            gender: createUserDTO.gender,
            roleId: 1,
          },
        });
      return userWithoutPass;
    } catch (error) {
      throw new InternalServerException(
        ErrorCodes.InternalServerErrorCode.INTERNAL_SERVER_ERROR,
        error.message,
      );
    }
  }
  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.checkExisted(id);

    if (updateUserDto.email) {
      const user = await this.findByEmail(updateUserDto.email);
      if (user && user.id !== id)
        throw new BadRequestException(
          ErrorCodes.BadRequestCode.EMAIL_ALREADY_EXISTS,
        );
    }

    return await this.databaseService.user.update({
      where: {
        id: id,
      },
      data: {
        email: updateUserDto.email,
        username: updateUserDto.username,
        DateOfBirth: updateUserDto.dob,
        gender: updateUserDto.gender,
      },
    });
  }
  async verifyEmail(id: string) {
    await this.checkExisted(id);

    return await this.databaseService.user.update({
      where: {
        id: id,
      },
      data: {
        isEmailVerified: true,
      },
    });
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    const usr = await this.databaseService.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!usr)
      throw new BadRequestException(ErrorCodes.BadRequestCode.USER_NOT_FOUND);

    const checkPassword = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      usr.hashedPassword,
    );
    if (!checkPassword)
      throw new BadRequestException(ErrorCodes.BadRequestCode.INVALID_PASSWORD);

    const hashedPassword = await this.hashedData(updatePasswordDto.newPassword);

    return await this.databaseService.user.update({
      where: {
        id: id,
      },
      data: {
        hashedPassword: hashedPassword,
      },
    });
  }
  async resetPassword(id: string, newPassword: string) {
    await this.checkExisted(id);

    const hashedPassword = await this.hashedData(newPassword);

    return await this.databaseService.user.update({
      where: {
        id: id,
      },
      data: {
        hashedPassword: hashedPassword,
      },
    });
  }

  async findUserRole(id?: string, email?: string) {
    if (!id && !email) {
      throw new BadRequestException(
        ErrorCodes.BadRequestCode.INVALID_REQUEST,
        'id or email is required',
      );
    }

    return await this.databaseService.user.findFirst({
      where: {
        OR: [
          {
            id: id,
          },
          {
            email: {
              contains: email,
            },
          },
        ],
      },
      select: {
        role: true,
      },
    });
  }

  async hashedData(rawString: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS));
      const hashed = await bcrypt.hash(rawString, salt);

      return hashed;
    } catch (error) {
      throw new InternalServerException(
        ErrorCodes.InternalServerErrorCode.INTERNAL_SERVER_ERROR,
        'Error when hashing ',
      );
    }
  }

  private async checkExisted(id: string) {
    const usr = await this.findOne(id);

    if (!usr)
      throw new BadRequestException(ErrorCodes.BadRequestCode.USER_NOT_FOUND);

    return usr;
  }
}
