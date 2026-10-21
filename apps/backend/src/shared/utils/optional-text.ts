/** Optional free text: trimmed, and blank becomes null. */
export function optionalText(value: string | undefined): string | null {
  return value?.trim() || null;
}
