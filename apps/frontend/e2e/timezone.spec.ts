import { format } from "date-fns";

import { expect, test } from "./fixtures";

test("runner and browser agree on dates at the UTC Sunday boundary", async ({
  page,
}) => {
  // Both instants are Monday in Prague but still Sunday in UTC. Cover
  // standard time and daylight saving time without changing the app's clock.
  const cases = [
    { instant: "2026-11-22T23:10:00Z", date: "2026-11-23" },
    { instant: "2026-07-05T22:10:00Z", date: "2026-07-06" },
  ];
  for (const { instant, date } of cases) {
    const browserDate = await page.evaluate((value) => {
      const local = new Date(value);
      return [
        local.getFullYear(),
        String(local.getMonth() + 1).padStart(2, "0"),
        String(local.getDate()).padStart(2, "0"),
      ].join("-");
    }, instant);

    expect(browserDate).toBe(date);
    expect(format(new Date(instant), "yyyy-MM-dd")).toBe(browserDate);
  }
});
