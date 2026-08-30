import { RoutineHydrationService } from '../../routines/routine-hydration.service';
import { MobileRoutineItemDto } from '../dto/mobile-routine-item.dto';
import type { RoutineRowForMobile } from '../types/routine-row-for-mobile.type';

export async function buildMobileRoutineItems(
  hydrationService: RoutineHydrationService,
  rows: RoutineRowForMobile[],
): Promise<MobileRoutineItemDto[]> {
  if (rows.length === 0) {
    return [];
  }

  const rawChunks = rows.map((row) => row.data as unknown);
  const hydratedChunks = await hydrationService.hydrateRoutineData(rawChunks);

  return rows.map((row, index) => ({
    id_routine: row.idRoutine,
    edited_at: row.editedAt.toISOString(),
    data: hydratedChunks[index],
  }));
}
