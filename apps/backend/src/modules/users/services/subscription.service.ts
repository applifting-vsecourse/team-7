import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { Prisma } from "@/generated/prisma/client";
import type { SubscriptionAction } from "@/modules/users/domain/subscription";
import {
  lockSubscription,
  subscriptionAccess,
  subscriptionRequired,
} from "@/shared/subscription/subscription-access";
import {
  dogLimit,
  FREE_DOG_LIMIT,
  FREE_GOAL_LIMIT,
  PLUS_DOG_LIMIT,
} from "@/shared/subscription/subscription.constants";

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    userId: string,
    db: Pick<
      Prisma.TransactionClient,
      "subscription" | "dog" | "dogGoal"
    > = this.prisma,
  ) {
    const access = await subscriptionAccess(db, userId);
    const [subscription, dogs, goals] = await Promise.all([
      db.subscription.findUnique({ where: { userId } }),
      db.dog.count({ where: { userId, archivedAt: null } }),
      db.dogGoal.count({
        where: {
          dog: {
            userId,
            archivedAt: null,
            // No active dog chosen yet: nothing counts towards the Free limit.
            ...(!access.isPlus ? { id: access.activeDogId ?? "" } : {}),
          },
          status: "in_progress",
        },
      }),
    ]);
    const now = new Date();
    const paid = !!subscription?.paidUntil && subscription.paidUntil > now;
    const trial = !!subscription?.trialEndsAt && subscription.trialEndsAt > now;
    return {
      status:
        // A failed renewal is pastDue only while the paid period runs; after
        // it ends the account is simply Free again and can pay or trial.
        subscription?.paymentFailed && !subscription.cancelled && paid
          ? "pastDue"
          : paid
            ? subscription?.cancelled
              ? "cancelled"
              : "active"
            : trial
              ? "trial"
              : "free",
      ...access,
      billingPeriod: subscription?.billingPeriod ?? "yearly",
      trialEndsAt: subscription?.trialEndsAt ?? null,
      paidUntil: subscription?.paidUntil ?? null,
      retryAt: subscription?.retryAt ?? null,
      trialUsed: !!subscription?.trialEndsAt,
      cardLast4: subscription?.cardLast4 ?? "4242",
      dogs,
      freeDogLimit: FREE_DOG_LIMIT,
      dogLimit: dogLimit(access.isPlus),
      plusDogLimit: PLUS_DOG_LIMIT,
      goals,
      goalLimit: access.isPlus ? null : FREE_GOAL_LIMIT,
    };
  }

  async update(
    userId: string,
    action: SubscriptionAction,
    billingPeriod?: "yearly" | "monthly",
  ) {
    await this.prisma.$transaction(async (tx) => {
      await lockSubscription(tx, userId);
      const current = await this.get(userId, tx);
      const now = new Date();
      // Paying extends what is still covered, so no days are lost: the paid
      // period of a failed renewal, or the rest of a running trial
      // (changeCard keeps the paid days too).
      const covered =
        current.status === "pastDue"
          ? current.paidUntil
          : current.status === "trial"
            ? current.trialEndsAt
            : null;
      const paidUntil = new Date(
        action === "pay" && covered && covered > now ? covered : now,
      );
      const period = ["pay", "trial"].includes(action)
        ? (billingPeriod ?? current.billingPeriod)
        : current.billingPeriod;
      // Clamp to the month's last day (31 Jan → 28 Feb, 29 Feb → 28 Feb).
      const day = paidUntil.getUTCDate();
      paidUntil.setUTCDate(1);
      paidUntil.setUTCMonth(
        paidUntil.getUTCMonth() + (period === "monthly" ? 1 : 12),
      );
      const lastDay = new Date(
        Date.UTC(paidUntil.getUTCFullYear(), paidUntil.getUTCMonth() + 1, 0),
      ).getUTCDate();
      paidUntil.setUTCDate(Math.min(day, lastDay));
      const trialEndsAt = new Date(now);
      trialEndsAt.setUTCDate(trialEndsAt.getUTCDate() + 14);
      if (
        action === "trial" &&
        (current.trialUsed || current.status !== "free")
      ) {
        throw new BadRequestException("Trial already used");
      }
      // A failed payment only simulates a failed renewal of a paid period; a
      // failed first payment charges nothing and changes nothing (Figma M11).
      if (
        (action === "cancel" ||
          action === "changeCard" ||
          action === "failPayment") &&
        !["active", "pastDue"].includes(current.status)
      ) {
        throw new BadRequestException("No active subscription");
      }
      if (action === "resume" && current.status !== "cancelled") {
        throw new BadRequestException("Subscription is not cancelled");
      }
      if (
        action === "pay" &&
        ["active", "cancelled"].includes(current.status)
      ) {
        throw new BadRequestException("Subscription is already paid");
      }
      const retryAt = new Date(now);
      retryAt.setUTCDate(retryAt.getUTCDate() + 3);
      const data =
        action === "trial"
          ? { trialEndsAt }
          : action === "pay"
            ? {
                paidUntil,
                cancelled: false,
                paymentFailed: false,
                retryAt: null,
              }
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
      await tx.subscription.upsert({
        where: { userId },
        create: { userId, ...data, billingPeriod: period },
        update: {
          ...data,
          billingPeriod: period,
          ...(["trial", "pay", "resume", "changeCard"].includes(action)
            ? { activeDogId: null }
            : {}),
        },
      });
    });
    return this.get(userId);
  }
  async dogChoices(userId: string) {
    const access = await subscriptionAccess(this.prisma, userId);
    if (!access.needsDogChoice) return [];
    const dogs = await this.prisma.dog.findMany({
      where: { userId, archivedAt: null },
      select: {
        id: true,
        name: true,
        breed: true,
        avatarVersion: true,
        _count: {
          select: { goals: { where: { status: { not: "completed" } } } },
        },
      },
    });
    return dogs.map(({ _count, ...dog }) => ({
      ...dog,
      unfinishedGoals: _count.goals,
    }));
  }

  async chooseDog(userId: string, dogId: string) {
    await this.prisma.$transaction(async (tx) => {
      await lockSubscription(tx, userId);
      const access = await subscriptionAccess(tx, userId);
      if (
        access.isPlus ||
        (!access.needsDogChoice && access.activeDogId !== dogId)
      )
        throw subscriptionRequired("dogChoiceRequired");
      const dog = await tx.dog.findFirst({
        where: { id: dogId, userId, archivedAt: null },
        select: { id: true },
      });
      if (!dog) throw new NotFoundException("Dog not found");
      await tx.subscription.upsert({
        where: { userId },
        create: { userId, activeDogId: dogId },
        update: { activeDogId: dogId },
      });
    });
    return this.get(userId);
  }
}
