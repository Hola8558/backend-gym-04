import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SharedUsersService } from '../users/shared-users.service';

@Injectable()
export class CoachesService {
  constructor(private readonly sharedUsers: SharedUsersService) {}

  findAll(id_account: number) {
    return this.sharedUsers.findManyByRole(id_account, UserRole.coach);
  }

  async findOne(id_user: number, id_account: number) {
    const row = await this.sharedUsers.findOneByIdAndRole(
      id_user,
      id_account,
      UserRole.coach,
    );
    if (!row) {
      throw new NotFoundException('Coach not found');
    }
    return row;
  }

  async update(
    id_user: number,
    id_account: number,
    dto: UpdateUserDto,
  ) {
    const row = await this.sharedUsers.updateUser(
      id_user,
      id_account,
      UserRole.coach,
      dto,
    );
    if (!row) {
      throw new NotFoundException('Coach not found');
    }
    return row;
  }

  async remove(id_user: number, id_account: number) {
    const ok = await this.sharedUsers.softDeleteUser(
      id_user,
      id_account,
      UserRole.coach,
    );
    if (!ok) {
      throw new NotFoundException('Coach not found');
    }
    return { deleted: true };
  }
}
