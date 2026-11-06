import { describe, expect, it } from "vitest";

import { moveIds, sortByIds } from "./exerciseOrder";

describe("moveIds", () => {
  const ids = ["a", "b", "c", "d"];

  it("moves an id after the target", () => {
    expect(moveIds(ids, new Set(["a"]), "c", "after")).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("moves an id before the target", () => {
    expect(moveIds(ids, new Set(["d"]), "a", "before")).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps several moved ids in their order", () => {
    expect(moveIds(ids, new Set(["d", "a"]), "c", "before")).toEqual([
      "b",
      "a",
      "d",
      "c",
    ]);
  });

  it("leaves the order alone for an unknown target", () => {
    expect(moveIds(ids, new Set(["a"]), "x", "after")).toEqual(ids);
  });
});

describe("sortByIds", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("follows the given ids", () => {
    expect(sortByIds(items, ["c", "a", "b"])).toEqual([
      { id: "c" },
      { id: "a" },
      { id: "b" },
    ]);
  });

  it("keeps items missing from the ids at the end in their order", () => {
    expect(sortByIds(items, ["b"])).toEqual([
      { id: "b" },
      { id: "a" },
      { id: "c" },
    ]);
  });
});
