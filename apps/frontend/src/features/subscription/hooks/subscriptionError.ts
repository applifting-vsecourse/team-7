export function subscriptionError(error: unknown): string | undefined {
  return error instanceof Error
    ? (error as Error & { subscriptionCode?: string }).subscriptionCode
    : undefined;
}
