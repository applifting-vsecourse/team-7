import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";
import type { EmailService } from "@/core/email/interfaces/email-service.interface";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Config } from "@/shared/config/config.service";
import { TrialRemindersService } from "./trial-reminders.service";

vi.mock("@/core/email/render", () => ({
  renderEmail: async () => "<p>Trial reminder</p>",
}));
describe("Plus trial reminders", () => {
  const prisma = mockDeep<PrismaService>();
  const email = mockDeep<EmailService>();
  const service = new TrialRemindersService(prisma, email, {
    frontendUrl: "https://trainloop.example",
  } as Config);
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.subscription.findMany.mockResolvedValue([
      { userId: "owner", user: { email: "owner@example.test" } },
    ] as never);
    prisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    email.sendEmail.mockResolvedValue(undefined);
  });
  it("finds verified, unpaid trials ending within a day and claims each reminder once", async () => {
    await service.sendTrialReminders();
    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trialReminderSentAt: null,
          user: { emailVerified: true },
          OR: [{ paidUntil: null }, { paidUntil: { lte: expect.any(Date) } }],
        }),
      }),
    );
    expect(email.sendEmail).toHaveBeenCalledWith(
      "owner@example.test",
      "Zkušební doba Plus končí zítra",
      "<p>Trial reminder</p>",
    );
    prisma.subscription.updateMany.mockResolvedValue({ count: 0 });
    await service.sendTrialReminders();
    expect(email.sendEmail).toHaveBeenCalledTimes(1);
  });
  it("releases the claim after a delivery failure so the next run can retry", async () => {
    email.sendEmail.mockRejectedValue(new Error("offline"));
    await service.sendTrialReminders();
    expect(prisma.subscription.updateMany).toHaveBeenLastCalledWith({
      where: { userId: "owner", trialReminderSentAt: expect.any(Date) },
      data: { trialReminderSentAt: null },
    });
  });
});
