import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountsModule } from './accounts/accounts.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { CoachesModule } from './coaches/coaches.module';
import { CustomerMembershipsModule } from './customer-memberships/customer-memberships.module';
import { CustomersModule } from './customers/customers.module';
import { ExercisesModule } from './exercises/exercises.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PrismaModule } from './core/prisma/prisma.module';
import { MembershipTypesModule } from './membership-types/membership-types.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RoutinesModule } from './routines/routines.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ActivityLogsModule,
    AccountsModule,
    UsersModule,
    CoachesModule,
    CustomersModule,
    ExercisesModule,
    ProfilesModule,
    RoutinesModule,
    MembershipTypesModule,
    CustomerMembershipsModule,
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
