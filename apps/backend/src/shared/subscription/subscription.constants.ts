// Quotas for non-archived dogs.
export const FREE_DOG_LIMIT = 1;
export const PLUS_DOG_LIMIT = 5;
// Free plan: in-progress goals across the active dog (paused ones don't count).
export const FREE_GOAL_LIMIT = 2;

export const dogLimit = (isPlus: boolean) =>
  isPlus ? PLUS_DOG_LIMIT : FREE_DOG_LIMIT;
