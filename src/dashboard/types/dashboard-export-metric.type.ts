export const DASHBOARD_EXPORT_METRICS = [
  'active_customers',
  'new_customers',
  'birthdays',
  'inactive_customers',
  'renewals',
  'expiring_soon',
  'loyalty',
  'attendance_today',
  'risky_customers',
] as const;

export type DashboardExportMetric = (typeof DASHBOARD_EXPORT_METRICS)[number];

export type DashboardExportCell = string | number | boolean | null;

export type DashboardExportRow = Record<string, DashboardExportCell>;

export function isDashboardExportMetric(value: string): value is DashboardExportMetric {
  return (DASHBOARD_EXPORT_METRICS as readonly string[]).includes(value);
}
