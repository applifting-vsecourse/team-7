import { ConflictException, GoneException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import { EmailChangeService } from "./email-change.service";

describe("revocable email changes", () => {
  const secret = "test-link-secret";
  const record = {
    id: "a".repeat(32),
    userId: "owner",
    originalEmail: "old@example.com",
    email: "new@example.com",
    tokenHash: createHash("sha256").update(secret).digest("hex"),
    authToken: "private-better-auth-token",
    callbackUrl: "https://trainloop.example/settings?lng=cs",
    expiresAt: new Date(Date.now() + 60_000),
    user: { email: "old@example.com" },
  };
  let prisma: ReturnType<typeof mockDeep<PrismaService>>;
  let service: EmailChangeService;
  beforeEach(() => {
    prisma = mockDeep<PrismaService>();
    prisma.$transaction.mockImplementation(async (run) => {
      if (typeof run !== "function")
        throw new Error("Expected interactive transaction");
      return run(prisma);
    });
    prisma.pendingEmailChange.findUnique.mockResolvedValue(record);
    prisma.pendingEmailChange.deleteMany.mockResolvedValue({ count: 1 });
    service = new EmailChangeService(prisma);
  });

  it("stores a hash of the public secret and replaces requests with a new ID", async () => {
    const { userId, originalEmail, email, authToken, callbackUrl, expiresAt } =
      record;
    const issued = await service.issue({
      userId,
      originalEmail,
      email,
      authToken,
      callbackUrl,
      expiresAt,
    });
    expect(issued).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const data = prisma.pendingEmailChange.upsert.mock.calls[0]![0];
    expect(data.create.tokenHash).toBe(
      createHash("sha256").update(issued).digest("hex"),
    );
    expect(data.create.id).not.toBe(record.id);
    expect(data.update).toEqual(data.create);
    expect(data.create.authToken).toBe(authToken);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it("returns only display fields for an active pending change", async () => {
    expect(await service.pending("owner")).toEqual({
      id: record.id,
      email: record.email,
      expiresAt: record.expiresAt,
    });
  });

  it("hides expired or already completed changes", async () => {
    prisma.pendingEmailChange.findUnique.mockResolvedValueOnce({
      ...record,
      expiresAt: new Date(0),
    });
    expect(await service.pending("owner")).toBeNull();
    prisma.pendingEmailChange.findUnique.mockResolvedValueOnce({
      ...record,
      user: { email: record.email },
    } as typeof record);
    expect(await service.pending("owner")).toBeNull();
  });

  it("cancels only the session user's exact pending request", async () => {
    await service.cancel("owner", record.id);
    expect(prisma.pendingEmailChange.findUnique).toHaveBeenCalledWith({
      where: { userId: "owner" },
      include: { user: { select: { email: true } } },
    });
    expect(prisma.pendingEmailChange.deleteMany).toHaveBeenCalledWith({
      where: { userId: "owner", id: record.id },
    });
  });

  it("discards only the change issued with the given secret", async () => {
    await service.discard("owner", secret);
    expect(prisma.pendingEmailChange.deleteMany).toHaveBeenCalledWith({
      where: { userId: "owner", tokenHash: record.tokenHash },
    });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it("rejects stale cancellation without cancelling a replacement", async () => {
    await expect(
      service.cancel("owner", "b".repeat(32)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.pendingEmailChange.deleteMany).not.toHaveBeenCalled();
  });

  it("rejects cancelled links without invoking BetterAuth", async () => {
    prisma.pendingEmailChange.findUnique.mockResolvedValue(null);
    const verify = vi.fn();
    await expect(service.confirm(secret, verify)).rejects.toBeInstanceOf(
      GoneException,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it("rechecks the link under the lock if cancellation wins the race", async () => {
    prisma.pendingEmailChange.findUnique
      .mockResolvedValueOnce(record)
      .mockResolvedValueOnce(null);
    const verify = vi.fn();
    await expect(service.confirm(secret, verify)).rejects.toBeInstanceOf(
      GoneException,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects expired links without invoking BetterAuth", async () => {
    prisma.pendingEmailChange.findUnique.mockResolvedValue({
      ...record,
      expiresAt: new Date(0),
    });
    const verify = vi.fn();
    await expect(service.confirm(secret, verify)).rejects.toBeInstanceOf(
      GoneException,
    );
    expect(verify).not.toHaveBeenCalled();
  });

  it("passes the private token to BetterAuth and consumes a successful link", async () => {
    const response = new Response("{}", { status: 200 });
    const verify = vi.fn().mockResolvedValue(response);
    expect(await service.confirm(secret, verify)).toEqual({
      response,
      callbackUrl: record.callbackUrl,
    });
    expect(verify).toHaveBeenCalledWith(record.authToken);
    expect(prisma.pendingEmailChange.delete).toHaveBeenCalledWith({
      where: { id: record.id },
    });
  });

  it("keeps a link retryable if BetterAuth rejects a different signed-in account", async () => {
    const response = new Response("{}", { status: 401 });
    await service.confirm(secret, vi.fn().mockResolvedValue(response));
    expect(prisma.pendingEmailChange.delete).not.toHaveBeenCalled();
  });
});
