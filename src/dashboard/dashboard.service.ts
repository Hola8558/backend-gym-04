import { Injectable } from '@nestjs/common';
import type { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/jwt.strategy';
import type { DashboardSignUpHalf } from '../customers/types/dashboard-sign-up-half';
import { CustomersService } from '../customers/customers.service';
import {
  evaluateDashboardMetricsGates,
  type DashboardMetricsGates,
} from './dashboard-metrics-gates';

/**
 * Dashboard-scoped read APIs (keeps HTTP controllers thin; delegates domain work to feature services).
 */
@Injectable()
export class DashboardService {
  constructor(private readonly customersService: CustomersService) {}

  /** Re-exported gate logic for controllers/services that must not import Prisma-heavy modules in a cycle. */
  static evaluateMetricsGates(
    userRole: UserRole,
    enabledFeatureIds: readonly number[],
  ): DashboardMetricsGates {
    return evaluateDashboardMetricsGates(userRole, enabledFeatureIds);
  }

  /** Twelve UTC calendar months of sign-ups for `year` (Jan–Dec), oldest first. */
  getAnnualSignUpTrend(idAccount: number, year: number) {
    return this.customersService.getAnnualSignUpTrendForAccount(idAccount, year);
  }

  /** Six renewal counts for `year` + `half` (H1 or H2), Jan–Jun or Jul–Dec. */
  getRenewalTrendCounts(idAccount: number, year: number, half: DashboardSignUpHalf) {
    return this.customersService.getRenewalTrendCountsForHalf(idAccount, year, half);
  }

  getCoachMetrics(user: JwtPayload, crowdmeterTimezone: string) {
    return this.customersService.getCoachDashboardMetrics(user, crowdmeterTimezone);
  }

  getSoloCoachDashboardMetrics(
    user: JwtPayload,
    trendView: { year: number; half: DashboardSignUpHalf },
    fullYearTrendYear: number,
  ) {
    return this.customersService.getSoloCoachDashboardMetrics(
      user,
      trendView,
      fullYearTrendYear,
    );
  }
}
