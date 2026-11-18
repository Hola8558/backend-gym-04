export function accountNamesMatch(
  stored: string | null,
  provided: string,
): boolean {
  const left = stored?.trim().toLocaleLowerCase() ?? '';
  const right = provided.trim().toLocaleLowerCase();
  return left.length > 0 && left === right;
}
