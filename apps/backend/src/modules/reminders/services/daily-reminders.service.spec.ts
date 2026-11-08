import { Logger } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import { EmailService } from "@/core/email/interfaces/email-service.interface";
import { emailMessages } from "@/core/email/messages";
import { PrismaService } from "@/core/prisma/prisma.service";
import { Config } from "@/shared/config/config.service";
import { DailyRemindersService } from "./daily-reminders.service";

describe("daily exercise reminders", () => {
  const prisma = mockDeep<PrismaService>();
  const email = mock<EmailService>();
  const config = mock<Config>({ frontendUrl: "https://trainloop.example" });
  const service = new DailyRemindersService(prisma, email, config);
  const exercise = (startsAt: string, userId = "owner") => ({
    startsAt: new Date(startsAt),
    dog: { user: { id: userId, email: `${userId}@example.com` } },
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T06:00:00Z"));
    prisma.scheduledExercise.findMany.mockResolvedValue([]);
    email.sendEmail.mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends one reminder per owner across multiple exercises and dogs", async () => {
    prisma.scheduledExercise.findMany.mockResolvedValue([
      exercise("2026-11-07T08:00:00Z"),
      exercise("2026-11-07T09:00:00Z"),
      exercise("2026-11-07T10:00:00Z", "other"),
    ] as never);

    await service.sendDailyReminders();

    expect(email.sendEmail).toHaveBeenCalledTimes(2);
    for (const owner of ["owner", "other"]) {
      expect(email.sendEmail).toHaveBeenCalledWith(
        `${owner}@example.com`,
        emailMessages.cs.dailyReminder.subject,
        expect.stringContaining(
          'href="https://trainloop.example/overview?lng=cs"',
        ),
      );
    }
    expect(prisma.scheduledExercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: "exercise",
          completedAt: null,
          deletedAt: null,
          dog: {
            archivedAt: null,
            user: { emailVerified: true, emailNotificationsEnabled: true },
          },
        }),
      }),
    );
  });

  it.each([
    ["2026-11-07T06:00:00Z", "2026-11-06T23:00:00Z", "2026-11-07T23:00:00Z"],
    ["2026-07-07T05:00:00Z", "2026-07-06T22:00:00Z", "2026-07-07T22:00:00Z"],
    ["2026-03-29T05:00:00Z", "2026-03-28T23:00:00Z", "2026-03-29T22:00:00Z"],
    ["2026-10-25T06:00:00Z", "2026-10-24T22:00:00Z", "2026-10-25T23:00:00Z"],
  ])("uses Prague's full calendar day at %s", async (now, start, end) => {
    vi.setSystemTime(new Date(now));
    prisma.scheduledExercise.findMany.mockResolvedValue([
      exercise(new Date(Date.parse(start) - 1).toISOString(), "yesterday"),
      exercise(start, "midnight"),
      exercise(new Date(Date.parse(end) - 1).toISOString(), "late"),
      exercise(end, "tomorrow"),
    ] as never);

    await service.sendDailyReminders();

    expect(email.sendEmail.mock.calls.map(([to]) => to)).toEqual([
      "midnight@example.com",
      "late@example.com",
    ]);
    const range = prisma.scheduledExercise.findMany.mock.calls[0]![0]!.where!
      .startsAt as { gte: Date; lt: Date };
    expect(range.gte.getTime()).toBeLessThanOrEqual(Date.parse(start));
    expect(range.lt.getTime()).toBeGreaterThanOrEqual(Date.parse(end));
  });

  it("does not send mail when there are no exercises today", async () => {
    prisma.scheduledExercise.findMany.mockResolvedValue([
      exercise("2026-11-08T08:00:00Z"),
    ] as never);
    await service.sendDailyReminders();
    expect(email.sendEmail).not.toHaveBeenCalled();
  });

  it("logs a failed delivery and continues with the remaining users", async () => {
    prisma.scheduledExercise.findMany.mockResolvedValue([
      exercise("2026-11-07T08:00:00Z", "first"),
      exercise("2026-11-07T08:00:00Z", "second"),
    ] as never);
    const error = new Error("Mail provider unavailable");
    email.sendEmail.mockRejectedValueOnce(error);
    const log = vi
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => {});
    await service.sendDailyReminders();
    expect(email.sendEmail).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("first"), error);
    expect(email.sendEmail).toHaveBeenLastCalledWith(
      "second@example.com",
      expect.any(String),
      expect.any(String),
    );
  });
});
