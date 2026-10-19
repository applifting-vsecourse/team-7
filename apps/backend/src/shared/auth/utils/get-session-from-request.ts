import { fromNodeHeaders } from "better-auth/node";
import { Request } from "express";
import { BetterAuth } from "@/shared/auth/providers/better-auth.provider";

export const getSessionFromRequest = async (
  req: Request,
  betterAuth: BetterAuth,
) => {
  return betterAuth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
};
