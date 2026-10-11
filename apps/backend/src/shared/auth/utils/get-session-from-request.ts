import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';

export const getSessionFromRequest = async (
  req: Request,
  betterAuth: BetterAuth,
  // oxlint-disable-next-line typescript/no-explicit-any -- Keep the existing session helper's public type.
) => {
  return betterAuth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
};
