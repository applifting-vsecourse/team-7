import { ConflictException, GoneException, Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Prisma } from "@/generated/prisma/client";

const publicFields = { id: true, email: true, expiresAt: true } as const;
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

@Injectable()
export class EmailChangeService {
  constructor(private readonly prisma: PrismaService) {}

  // Advisory locks coordinate our issuance, cancellation and confirmation.
  // They do not lock the user row that BetterAuth updates via its own adapter.
  private locked<T>(
    userId: string,
    run: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`email-change:${userId}`}, 0))::text`;
        return run(tx);
      },
      { timeout: 15_000 },
    );
  }

  async issue(input: {
    userId: string;
    originalEmail: string;
    email: string;
    authToken: string;
    callbackUrl: string;
    expiresAt: Date;
  }) {
    const secret = randomBytes(32).toString("base64url");
    // A replacement gets a new ID too, so a stale browser cannot cancel it.
    const id = randomBytes(16).toString("hex");
    await this.locked(input.userId, (tx) =>
      tx.pendingEmailChange.upsert({
        where: { userId: input.userId },
        create: { ...input, id, tokenHash: hashToken(secret) },
        update: { ...input, id, tokenHash: hashToken(secret) },
      }),
    );
    return secret;
  }

  async pending(userId: string) {
    const pending = await this.prisma.pendingEmailChange.findUnique({
      where: { userId },
      select: {
        ...publicFields,
        originalEmail: true,
        user: { select: { email: true } },
      },
    });
    if (
      !pending ||
      pending.expiresAt <= new Date() ||
      pending.user.email !== pending.originalEmail
    )
      return null;
    return {
      id: pending.id,
      email: pending.email,
      expiresAt: pending.expiresAt,
    };
  }

  async cancel(userId: string, id: string) {
    await this.locked(userId, async (tx) => {
      const pending = await tx.pendingEmailChange.findUnique({
        where: { userId },
        include: { user: { select: { email: true } } },
      });
      if (
        !pending ||
        pending.id !== id ||
        pending.originalEmail !== pending.user.email
      )
        throw new ConflictException(
          "Email change already completed, cancelled or replaced",
        );
      const removed = await tx.pendingEmailChange.deleteMany({
        where: { userId, id },
      });
      if (removed.count !== 1)
        throw new ConflictException(
          "Email change already completed, cancelled or replaced",
        );
    });
  }

  async confirm(
    secret: string,
    verify: (authToken: string) => Promise<Response>,
  ) {
    const tokenHash = hashToken(secret);
    const candidate = await this.prisma.pendingEmailChange.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    if (!candidate)
      throw new GoneException("Email change link is no longer valid");
    return this.locked(candidate.userId, async (tx) => {
      const pending = await tx.pendingEmailChange.findUnique({
        where: { tokenHash },
      });
      if (!pending || pending.expiresAt <= new Date())
        throw new GoneException("Email change link is no longer valid");
      const response = await verify(pending.authToken);
      if (response.ok)
        await tx.pendingEmailChange.delete({ where: { id: pending.id } });
      return { response, callbackUrl: pending.callbackUrl };
    });
  }
}
