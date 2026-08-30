export function getPrismaTargetFields(target: unknown): string[] {
  if (!target) {
    return [];
  }

  return Array.isArray(target) ? target.map(String) : [String(target)];
}

export function hasPrismaTargetField(target: unknown, field: string): boolean {
  return getPrismaTargetFields(target).includes(field);
}
