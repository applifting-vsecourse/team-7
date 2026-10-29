import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {
  type BetterAuth,
  InjectBetterAuth,
} from "@/shared/auth/providers/better-auth.provider";
import { getSessionFromRequest } from "@/shared/auth/utils/get-session-from-request";

@Injectable()
export class AuthenticatedUserGuard implements CanActivate {
  constructor(@InjectBetterAuth private readonly betterAuth: BetterAuth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const session = await getSessionFromRequest(request, this.betterAuth);

    if (!session) {
      // 401: the caller is not signed in (403 would mean "signed in but not allowed")
      throw new UnauthorizedException();
    }
    // Signed in, but the app stays locked until the email is verified.
    if (!session.user.emailVerified) {
      throw new ForbiddenException("Email not verified");
    }

    request.session = session;
    return true;
  }
}
