import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountsModule } from './accounts/accounts.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { CoachesModule } from './coaches/coaches.module';
import { CrowdmeterModule } from './crowdmeter/crowdmeter.module';
import { CustomerMembershipsModule } from './customer-memberships/customer-memberships.module';
import { CustomerMenusModule } from './customer-menus/customer-menus.module';
import { CustomersModule } from './customers/customers.module';
import { CustomersPersonalInfoModule } from './customers/personal-info/customers-personal-info.module';
import { CustomersResourcesModule } from './customers/resources/customers-resources.module';
import { CustomersMembershipModule } from './customers/membership/customers-membership.module';
import { CustomersMenusModule } from './customers/menus/customers-menus.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExercisesModule } from './exercises/exercises.module';
import { FeaturesModule } from './features/features.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AccessGuard } from './common/guards/access.guard';
import { FeatureGuard } from './common/guards/feature.guard';
import { PrismaModule } from './core/prisma/prisma.module';
import { MembershipTypesModule } from './membership-types/membership-types.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RecipesModule } from './recipes/recipes.module';
import { ResourcesModule } from './resources/resources.module';
import { RoutinesModule } from './routines/routines.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';
import { DailyInitializationInterceptor } from './daily-tasks/daily-initialization.interceptor';
import { DailyTasksModule } from './daily-tasks/daily-tasks.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    ActivityLogsModule,
    AccountsModule,
    UsersModule,
    CoachesModule,
    CrowdmeterModule,
    CustomersPersonalInfoModule,
    CustomersResourcesModule,
    CustomersMembershipModule,
    CustomersMenusModule,
    CustomersModule,
    DashboardModule,
    ExercisesModule,
    FeaturesModule,
    IngredientsModule,
    ProfilesModule,
    RoutinesModule,
    ResourcesModule,
    RecipesModule,
    MembershipTypesModule,
    MembershipsModule,
    CustomerMembershipsModule,
    CustomerMenusModule,
    AuthModule,
    SettingsModule,
    DailyTasksModule,
    TasksModule,
    WhatsappModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AccessGuard,
    FeatureGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DailyInitializationInterceptor,
    },
  ],
})
export class AppModule {}
