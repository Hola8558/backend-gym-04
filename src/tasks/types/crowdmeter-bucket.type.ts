export const CROWD_METER_BUCKETS = [
  '12am',
  '2am',
  '4am',
  '6am',
  '8am',
  '10am',
  '12pm',
  '2pm',
  '4pm',
  '6pm',
  '8pm',
  '10pm',
] as const;

export type CrowdmeterBucket = (typeof CROWD_METER_BUCKETS)[number];

export type CrowdmeterData = Record<CrowdmeterBucket, number>;
