/**
 * True when client cache stamps equal the server menu timestamps (ms precision).
 * Missing/invalid client values → not a match (force full payload).
 */
export function menuTimestampsMatch(
  menuCreatedAt: Date,
  menuUpdatedAt: Date,
  clientCreatedAt: string | null | undefined,
  clientUpdatedAt: string | null | undefined,
): boolean {
  if (clientCreatedAt == null || clientUpdatedAt == null) {
    return false;
  }
  const createdMs = Date.parse(clientCreatedAt);
  const updatedMs = Date.parse(clientUpdatedAt);
  if (!Number.isFinite(createdMs) || !Number.isFinite(updatedMs)) {
    return false;
  }
  return (
    createdMs === menuCreatedAt.getTime() &&
    updatedMs === menuUpdatedAt.getTime()
  );
}
