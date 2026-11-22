import { useState } from "react";
import { CircleXmark, CrownDiamond } from "@gravity-ui/icons";
import {
  Alert,
  Button,
  Description,
  Label,
  Modal,
  Radio,
  RadioGroup,
  toast,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  applySubscription,
  subscriptionQueryOptions,
  updateSubscription,
  type SubscriptionAction,
} from "@/features/settings/api/subscriptionQueryOptions";
import {
  PlanOptions,
  type BillingPeriod,
} from "@/features/subscription/components/PlanOptions";

import { SettingsSectionHeader } from "./SettingsSectionHeader";

export function SubscriptionSettings({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation();
  const query = useQuery(subscriptionQueryOptions(userId));
  const client = useQueryClient();
  const [dialog, setDialog] = useState<"payment" | "card" | "cancel" | null>(
    null,
  );
  const [outcome, setOutcome] = useState("success");
  // A declined first payment charges nothing and changes nothing (Figma M11).
  const [declined, setDeclined] = useState(false);
  const [period, setPeriod] = useState<BillingPeriod>("yearly");
  const mutation = useMutation({
    mutationFn: (action: SubscriptionAction) =>
      updateSubscription(
        action,
        ["pay", "trial"].includes(action) ? period : undefined,
      ),
    onSuccess: (saved) => {
      void applySubscription(client, userId, saved);
      setDialog(null);
      if (saved.status !== "pastDue") {
        toast.success(t(($) => $.subscription.saved));
      }
    },
  });
  const act = (action: SubscriptionAction) => {
    if (!mutation.isPending) mutation.mutate(action);
  };
  const open = (next: typeof dialog) => {
    mutation.reset();
    setPeriod(query.data?.billingPeriod ?? "yearly");
    setOutcome("success");
    setDeclined(false);
    setDialog(next);
  };
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }).format(new Date(value))
      : "";
  const s = query.data;
  const error = (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t(($) => $.subscription.saveError)}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-muted">
        {t(($) => $.settings.loading)}
      </p>
    );
  }
  if (query.isError || !s) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-danger">
          {t(($) => $.subscription.loadError)}
        </p>
        <Button variant="secondary" onPress={() => void query.refetch()}>
          {t(($) => $.dogs.retry)}
        </Button>
      </div>
    );
  }
  const cancelled = s.status === "cancelled";
  const pastDue = s.status === "pastDue";
  const free = s.status === "free";
  const trial = s.status === "trial";
  const dogUsage = [
    t(($) => $.subscription.dogs),
    t(($) => $.subscription.usage, { count: s.dogs, limit: s.dogLimit }),
  ];
  const rows = [
    [
      t(($) => $.subscription.plan),
      free
        ? t(($) => $.subscription.free)
        : s.billingPeriod === "monthly"
          ? t(($) => $.subscription.plusMonthly)
          : t(($) => $.subscription.plus),
    ],
    ...(free
      ? [
          dogUsage,
          [
            t(($) => $.subscription.goals),
            t(($) => $.subscription.usage, {
              count: s.goals,
              limit: s.goalLimit,
            }),
          ],
        ]
      : trial
        ? [
            [t(($) => $.subscription.trialUntil), date(s.trialEndsAt)],
            [
              t(($) => $.subscription.afterwards),
              t(($) => $.subscription.freeAfterTrial),
            ],
            dogUsage,
          ]
        : [
            [
              cancelled
                ? t(($) => $.subscription.validUntil)
                : pastDue
                  ? t(($) => $.subscription.retryPayment)
                  : t(($) => $.subscription.nextPayment),
              date(pastDue ? s.retryAt : s.paidUntil),
            ],
            ...(!cancelled
              ? [
                  [
                    t(($) => $.subscription.card),
                    t(($) => $.subscription.mockCard, { last4: s.cardLast4 }),
                  ],
                ]
              : []),
            ...(s.isPlus ? [dogUsage] : []),
          ]),
  ];
  return (
    <section
      aria-labelledby="subscription-heading"
      className="flex w-full flex-col items-start gap-6"
    >
      {cancelled ? (
        <h2
          id="subscription-heading"
          className="text-xl leading-7 font-semibold tracking-tight"
        >
          {t(($) => $.subscription.title)}
        </h2>
      ) : (
        <SettingsSectionHeader
          id="subscription-heading"
          title={t(($) => $.subscription.title)}
          description={
            free
              ? t(($) => $.subscription.freeDescription, {
                  count: s.freeDogLimit,
                  goals: s.goalLimit,
                })
              : trial
                ? t(($) => $.subscription.trialDescription, {
                    date: date(s.trialEndsAt),
                  })
                : t(($) => $.subscription.activeDescription)
          }
        />
      )}
      {(cancelled || pastDue) && (
        <div className="flex w-full flex-col gap-3">
          <Alert
            status={pastDue ? "danger" : "accent"}
            className="w-full flex-wrap"
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {pastDue
                  ? t(($) => $.subscription.paymentFailed)
                  : t(($) => $.subscription.endsOn, {
                      date: date(s.paidUntil),
                    })}
              </Alert.Title>
              <Alert.Description>
                {pastDue
                  ? t(($) => $.subscription.paymentFailedDescription)
                  : t(($) => $.subscription.cancelledDescription)}
              </Alert.Description>
            </Alert.Content>
            <Button
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto"
              isPending={mutation.isPending}
              isDisabled={mutation.isPending}
              onPress={() => (cancelled ? act("resume") : open("card"))}
            >
              {cancelled && (
                <CrownDiamond className="size-4" aria-hidden="true" />
              )}
              {cancelled
                ? t(($) => $.subscription.resume)
                : t(($) => $.subscription.changeCard)}
            </Button>
          </Alert>
        </div>
      )}
      <dl className="flex w-full flex-col gap-2 text-base leading-7">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {!cancelled && !pastDue && (
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          {free || trial ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-accent sm:w-auto"
              isDisabled={mutation.isPending}
              isPending={mutation.isPending}
              onPress={() =>
                free && !s.trialUsed ? act("trial") : open("payment")
              }
            >
              <CrownDiamond className="size-4" aria-hidden="true" />
              {free && !s.trialUsed
                ? t(($) => $.subscription.tryPlus)
                : t(($) => $.subscription.pay)}
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                onPress={() => open("card")}
              >
                {t(($) => $.subscription.changeCard)}
              </Button>
              <Button
                size="sm"
                variant="danger-soft"
                className="w-full sm:w-auto"
                onPress={() => open("cancel")}
              >
                <CircleXmark className="size-4" aria-hidden="true" />
                {t(($) => $.subscription.cancel)}
              </Button>
            </>
          )}
        </div>
      )}
      {mutation.isError && !dialog && error}
      <Modal.Backdrop
        isOpen={dialog !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !mutation.isPending) setDialog(null);
        }}
        isDismissable={!mutation.isPending}
      >
        <Modal.Container scroll="outside">
          <Modal.Dialog className="bg-background sm:max-w-2xl">
            <Modal.CloseTrigger
              isDisabled={mutation.isPending}
              aria-label={t(($) => $.subscription.close)}
            />
            <Modal.Header>
              {dialog === "cancel" && (
                <Modal.Icon className="bg-default">
                  <CircleXmark
                    className="size-4 text-danger"
                    aria-hidden="true"
                  />
                </Modal.Icon>
              )}
              <Modal.Heading
                className={
                  dialog === "cancel"
                    ? undefined
                    : "text-2xl font-semibold tracking-tight"
                }
              >
                {dialog === "cancel"
                  ? t(($) => $.subscription.cancelTitle)
                  : dialog === "card"
                    ? t(($) => $.subscription.changeCard)
                    : t(($) => $.subscription.pay)}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              {dialog === "cancel" ? (
                <>
                  <p>
                    {t(($) => $.subscription.cancelIntro, {
                      date: date(s.paidUntil),
                    })}
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>{t(($) => $.subscription.cancelDogs)}</li>
                    <li>{t(($) => $.subscription.cancelGoals)}</li>
                    <li>{t(($) => $.subscription.cancelVideos)}</li>
                  </ul>
                  <p>{t(($) => $.subscription.nothingDeleted)}</p>
                </>
              ) : (
                <>
                  <Alert status="accent">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>
                        {t(($) => $.subscription.mockNotice)}
                      </Alert.Title>
                    </Alert.Content>
                  </Alert>
                  <p>
                    {dialog === "card"
                      ? t(($) => $.subscription.mockCardChange)
                      : t(($) => $.subscription.plus)}
                  </p>
                  {dialog === "payment" && (
                    <PlanOptions
                      value={period}
                      onChange={setPeriod}
                      isDisabled={mutation.isPending}
                    />
                  )}
                  {declined && (
                    <Alert
                      status="danger"
                      className="animate-enter bg-danger-soft"
                    >
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>
                          {t(($) => $.limits.paymentDeclined)}
                        </Alert.Title>
                        <Alert.Description>
                          {t(($) => $.limits.paymentDeclinedDescription)}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>
                  )}
                  <RadioGroup
                    value={outcome}
                    onChange={(value) => {
                      setOutcome(value);
                      setDeclined(false);
                    }}
                    isDisabled={mutation.isPending}
                  >
                    <Label>{t(($) => $.subscription.mockOutcome)}</Label>
                    <Radio value="success">
                      <Radio.Content>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        {t(($) => $.subscription.mockSuccess)}
                      </Radio.Content>
                      <Description>
                        {t(($) => $.subscription.mockSuccessDescription)}
                      </Description>
                    </Radio>
                    <Radio value="failure">
                      <Radio.Content>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        {t(($) => $.subscription.mockFailure)}
                      </Radio.Content>
                    </Radio>
                  </RadioGroup>
                </>
              )}
              {mutation.isError && error}
            </Modal.Body>
            <Modal.Footer className="flex-wrap">
              <Button
                variant="secondary"
                className="flex-auto sm:flex-none"
                isDisabled={mutation.isPending}
                onPress={() => setDialog(null)}
              >
                {dialog === "cancel"
                  ? t(($) => $.subscription.keepPlus)
                  : t(($) => $.subscription.back)}
              </Button>
              <Button
                variant={dialog === "cancel" ? "danger" : "primary"}
                className="flex-auto sm:flex-none"
                isPending={mutation.isPending}
                isDisabled={mutation.isPending}
                onPress={() =>
                  dialog === "payment" && outcome === "failure"
                    ? setDeclined(true)
                    : act(
                        dialog === "cancel"
                          ? "cancel"
                          : outcome === "failure"
                            ? "failPayment"
                            : dialog === "card"
                              ? "changeCard"
                              : "pay",
                      )
                }
              >
                {dialog === "cancel"
                  ? t(($) => $.subscription.cancel)
                  : t(($) => $.subscription.confirmMock)}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  );
}
