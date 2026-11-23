// Whole-percent display that never shows 0 % or 100 % for a rate that isn't
// exactly that (199/200 reads 99 %, 1/200 reads 1 %).
export const displayRate = (rate: number) =>
  rate > 0 && rate < 1 ? Math.min(Math.max(rate, 0.01), 0.99) : rate;
