/** Puts items in the order of `ids`; unknown ones keep their order at the end. */
export function sortByIds<T extends { id: string }>(
  items: T[],
  ids: string[],
): T[] {
  const index = new Map(ids.map((id, position) => [id, position]));
  const at = (item: T) => index.get(item.id) ?? Number.MAX_SAFE_INTEGER;
  return items.toSorted((a, b) => at(a) - at(b));
}

/**
 * The order after dropping `moved` before or after `target`, as React Aria's
 * `onReorder` reports it. The moved ids keep their relative order.
 */
export function moveIds(
  ids: string[],
  moved: ReadonlySet<string>,
  target: string,
  dropPosition: "before" | "after",
): string[] {
  const rest = ids.filter((id) => !moved.has(id));
  const targetIndex = rest.indexOf(target);
  if (targetIndex === -1) return ids;
  const at = targetIndex + (dropPosition === "after" ? 1 : 0);
  return [
    ...rest.slice(0, at),
    ...ids.filter((id) => moved.has(id)),
    ...rest.slice(at),
  ];
}
