/** Milliseconds in a fixed 24-hour day, used for UTC date shifts and query-range padding.
 * Local calendar days can be shorter or longer during daylight-saving transitions.
 */
export const dayMs = 24 * 60 * 60 * 1000;
