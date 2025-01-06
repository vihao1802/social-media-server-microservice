import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class RoleService {
  constructor(private readonly _databaseService: DatabaseService) {}

  async findMany() {
    return await this._databaseService.role.findMany();
  }

  async findRoleById(id: number) {
    return await this._databaseService.role.findUnique({
      where: { id },
    });
  }

  async findUserByRoleName(roleName: string) {
    return await this._databaseService.role.findUnique({
      where: {
        roleName: roleName,
      },
    });
  }
}
