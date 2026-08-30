import {
  CROWD_METER_BUCKETS,
  CrowdmeterBucket,
  CrowdmeterData,
} from '../types/crowdmeter-bucket.type';

export function createEmptyCrowdmeterData(): CrowdmeterData {
  return CROWD_METER_BUCKETS.reduce((data, bucket) => {
    data[bucket] = 0;
    return data;
  }, {} as CrowdmeterData);
}

export function getCrowdmeterBucketForDate(date: Date): CrowdmeterBucket {
  const utcHour = date.getUTCHours();

  if (utcHour === 23 || utcHour === 0) {
    return '12am';
  }

  return CROWD_METER_BUCKETS[Math.floor((utcHour + 1) / 2)];
}

export function buildCrowdmeterData(
  entryDates: Date[],
  maxCapacity: number,
): CrowdmeterData {
  const data = createEmptyCrowdmeterData();
  const countsByBucket = createEmptyCrowdmeterData();
  const distinctDates = new Set<string>();

  for (const entryDate of entryDates) {
    distinctDates.add(entryDate.toISOString().slice(0, 10));
    countsByBucket[getCrowdmeterBucketForDate(entryDate)] += 1;
  }

  const distinctDateCount = distinctDates.size;
  if (distinctDateCount === 0 || maxCapacity <= 0) {
    return data;
  }

  for (const bucket of CROWD_METER_BUCKETS) {
    /**
     * Crowdmeter stores a predictive capacity trend, not the raw historical count.
     * Each bucket count contains all logs found for this weekday across history, so
     * we divide by the number of distinct historical dates to get the average number
     * of entries expected in that time bucket for this weekday.
     *
     * Example: if there are 4 total logs at 2pm spread across 3 distinct historical
     * Fridays, the average is 1.33 entries. Against a maxCapacity of 10, that becomes
     * Math.round((1.33 / 10) * 100) = 13%.
     */
    const averageEntries = countsByBucket[bucket] / distinctDateCount;
    const capacityPercentage = Math.round((averageEntries / maxCapacity) * 100);
    data[bucket] = Math.min(capacityPercentage, 100);
  }

  return data;
}
