import { CrowdmeterDay } from '@prisma/client';

const UTC_DAY_TO_CROWDMETER_DAY: CrowdmeterDay[] = [
  CrowdmeterDay.sun,
  CrowdmeterDay.mon,
  CrowdmeterDay.tue,
  CrowdmeterDay.wed,
  CrowdmeterDay.thu,
  CrowdmeterDay.fri,
  CrowdmeterDay.sat,
];

export function getCrowdmeterDayForDate(date: Date): CrowdmeterDay {
  return UTC_DAY_TO_CROWDMETER_DAY[date.getUTCDay()];
}
