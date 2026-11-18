import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { SubscriptionAction } from "@/modules/users/domain/subscription";

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const [subscription, dogs, goals] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { userId } }),
      this.prisma.dog.count({ where: { userId, archivedAt: null } }),
      this.prisma.dogGoal.count({
        where: { dog: { userId, archivedAt: null }, status: "in_progress" },
      }),
    ]);
    const now = new Date();
    const paid = !!subscription?.paidUntil && subscription.paidUntil > now;
    const trial = !!subscription?.trialEndsAt && subscription.trialEndsAt > now;
    return {
      status:
        subscription?.paymentFailed && !subscription.cancelled
          ? "pastDue"
          : paid
            ? subscription?.cancelled
              ? "cancelled"
              : "active"
            : trial
              ? "trial"
              : "free",
      trialEndsAt: subscription?.trialEndsAt ?? null,
      paidUntil: subscription?.paidUntil ?? null,
      retryAt: subscription?.retryAt ?? null,
      trialUsed: !!subscription?.trialEndsAt,
      cardLast4: subscription?.cardLast4 ?? "4242",
      dogs,
      goals,
    };
  }

  async update(userId: string, action: SubscriptionAction) {
    const current = await this.get(userId);
    const now = new Date();
    const paidUntil = new Date(now);
    paidUntil.setUTCFullYear(paidUntil.getUTCFullYear() + 1);
    const trialEndsAt = new Date(now);
    trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 14);
    if (
      action === "trial" &&
      (current.trialUsed || current.status !== "free")
    ) {
      throw new BadRequestException("Trial already used");
    }
    if (
      (action === "cancel" || action === "changeCard") &&
      !["active", "pastDue"].includes(current.status)
    ) {
      throw new BadRequestException("No active subscription");
    }
    if (action === "resume" && current.status !== "cancelled") {
      throw new BadRequestException("Subscription is not cancelled");
    }
    if (action === "pay" && ["active", "cancelled"].includes(current.status)) {
      throw new BadRequestException("Subscription is already paid");
    }
    const retryAt = new Date(now);
    retryAt.setUTCDate(retryAt.getUTCDate() + 3);
    const data =
      action === "trial"
        ? { trialEndsAt }
        : action === "pay"
          ? { paidUntil, cancelled: false, paymentFailed: false, retryAt: null }
          : action === "failPayment"
            ? { paymentFailed: true, cancelled: false, retryAt }
            : action === "cancel"
              ? { cancelled: true, paymentFailed: false, retryAt: null }
              : action === "resume"
                ? { cancelled: false }
                : {
                    cardLast4: current.cardLast4 === "4242" ? "5556" : "4242",
                    paymentFailed: false,
                    retryAt: null,
                    ...(current.status === "pastDue"
                      ? {
                          paidUntil:
                            current.paidUntil && current.paidUntil > now
                              ? current.paidUntil
                              : paidUntil,
                          cancelled: false,
                        }
                      : {}),
                  };
    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.get(userId);
  }
}
