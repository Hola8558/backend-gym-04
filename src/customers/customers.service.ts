import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { SharedUsersService } from '../users/shared-users.service';

@Injectable()
export class CustomersService {
  constructor(private readonly sharedUsers: SharedUsersService) {}

  findAll(id_account: number) {
    return this.sharedUsers.findManyByRole(id_account, UserRole.customer);
  }

  async findOne(id_user: number, id_account: number) {
    const row = await this.sharedUsers.findOneByIdAndRole(
      id_user,
      id_account,
      UserRole.customer,
    );
    if (!row) {
      throw new NotFoundException('Customer not found');
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
      UserRole.customer,
      dto,
    );
    if (!row) {
      throw new NotFoundException('Customer not found');
    }
    return row;
  }

  async remove(id_user: number, id_account: number, actor_user_id: number) {
    const ok = await this.sharedUsers.softDeleteUser(
      id_user,
      id_account,
      UserRole.customer,
      actor_user_id,
    );
    if (!ok) {
      throw new NotFoundException('Customer not found');
    }
    return { deleted: true };
  }
}
