import { useEffect, useRef, useState } from "react";
import { Check, CrownDiamond } from "@gravity-ui/icons";
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
import { useAtom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";
import { DogAvatar } from "@/features/dogs/components/DogAvatar";
import {
  applySubscription,
  chooseActiveDog,
  dogChoicesQueryOptions,
  updateSubscription,
  type Subscription,
} from "@/features/settings/api/subscriptionQueryOptions";
import {
  plusOfferAtom,
  type PlusOffer,
} from "@/features/subscription/atoms/plusOfferAtom";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

import { PlanOptions, type BillingPeriod } from "./PlanOptions";

const restrictedKeys = new Set([
  "dogs",
  "archivedDogs",
  "dogProfiles",
  "disciplines",
  "onboarding",
  "events",
  "planningExercises",
  "sessionVideos",
  "videoPlayback",
]);
export function SubscriptionDialogs() {
  const { user } = useSession();
  const query = useSubscription();
  const client = useQueryClient();
  const [offer, setOffer] = useAtom(plusOfferAtom);
  const selectDogs = useSetAtom(selectedDogIdsAtom);
  const previous = useRef<{
    isPlus: boolean;
    activeDogId: string | null;
  } | null>(null);
  const access = query.data;
  useEffect(() => {
    if (!access || !user) return;
    const last = previous.current;
    if (
      last &&
      !access.isPlus &&
      (last.isPlus || last.activeDogId !== access.activeDogId)
    ) {
      // Remove the previous entitlement's data before any refetch can fail.
      selectDogs(null);
      void client.resetQueries({
        predicate: (query) => restrictedKeys.has(String(query.queryKey[0])),
      });
    }
    previous.current = {
      isPlus: access.isPlus,
      activeDogId: access.activeDogId,
    };
  }, [access, client, user, selectDogs]);
  if (!user || !access) return null;
  const saved = (data: Subscription) =>
    applySubscription(client, user.id, data);
  return (
    <>
      {offer && (
        <PlusOfferDialog
          key={offer.reason}
          offer={offer}
          subscription={access}
          onClose={() => setOffer(null)}
          onSaved={saved}
        />
      )}
      {access.needsDogChoice && !offer && (
        <ActiveDogDialog
          onUpgrade={() => setOffer({ reason: "renew" })}
          onSaved={saved}
        />
      )}
    </>
  );
}

function PlusOfferDialog({
  offer,
  subscription,
  onClose,
  onSaved,
}: {
  offer: PlusOffer;
  subscription: Subscription;
  onClose: () => void;
  onSaved: (data: Subscription) => Promise<void>;
}) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<BillingPeriod>(
    subscription.billingPeriod,
  );
  const [checkout, setCheckout] = useState(false);
  const [outcome, setOutcome] = useState("success");
  // A declined first payment charges nothing and changes nothing (Figma M11).
  const [declined, setDeclined] = useState(false);
  const trialAvailable = !subscription.trialUsed && !subscription.isPlus;
  const mutation = useMutation({
    mutationFn: () =>
      updateSubscription(!checkout && trialAvailable ? "trial" : "pay", period),
    onSuccess: async (data) => {
      await onSaved(data);
      onClose();
      if (data.isPlus) {
        if (!checkout && data.trialEndsAt) {
          toast.success(
            t(($) => $.limits.trialStarted, {
              date: new Intl.DateTimeFormat(i18n.language, {
                day: "numeric",
                month: "numeric",
                year: "numeric",
              }).format(new Date(data.trialEndsAt)),
            }),
          );
        }
        offer.onSuccess?.();
      }
    },
  });
  const titles = {
    dogs: t(($) => $.limits.dogsTitle, {
      limit: subscription.plusDogLimit,
    }),
    goals: t(($) => $.limits.goalsTitle),
    videos: t(($) => $.limits.videosTitle),
    stats: t(($) => $.limits.statsTitle),
    renew: t(($) => $.subscription.pay),
  };
  const descriptions = {
    dogs: t(($) => $.limits.dogsDescription, {
      count: subscription.freeDogLimit,
    }),
    goals: t(($) => $.limits.goalsDescription, {
      limit: subscription.goalLimit,
    }),
    videos: t(($) => $.limits.videosDescription),
    stats: t(($) => $.limits.statsDescription),
    renew: t(($) => $.limits.payDescription),
  };
  return (
    <Modal.Backdrop
      isOpen
      isDismissable={!mutation.isPending}
      isKeyboardDismissDisabled={mutation.isPending}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <Modal.Container scroll="outside">
        <Modal.Dialog className="bg-background sm:max-w-2xl">
          <Modal.CloseTrigger
            isDisabled={mutation.isPending}
            aria-label={t(($) => $.subscription.close)}
          />
          <Modal.Header>
            <Modal.Heading className="text-2xl font-semibold tracking-tight">
              {checkout
                ? t(($) => $.limits.testCheckout)
                : titles[offer.reason]}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <p>{descriptions[offer.reason]}</p>
            {trialAvailable && !checkout && (
              <ul className="flex flex-col gap-3">
                {[
                  t(($) => $.limits.unlimited, {
                    limit: subscription.plusDogLimit,
                  }),
                  t(($) => $.limits.videosBenefit),
                  t(($) => $.limits.statsBenefit),
                ].map((text) => (
                  <li key={text} className="flex items-center gap-3">
                    <Check
                      className="size-5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    {text}
                  </li>
                ))}
              </ul>
            )}
            <PlanOptions
              value={period}
              onChange={setPeriod}
              isDisabled={mutation.isPending}
            />
            {checkout ? (
              <>
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
                <Alert status="accent">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>
                      {t(($) => $.subscription.mockNotice)}
                    </Alert.Title>
                  </Alert.Content>
                </Alert>
                <RadioGroup
                  value={outcome}
                  onChange={(value) => {
                    setOutcome(value);
                    setDeclined(false);
                  }}
                  isDisabled={mutation.isPending}
                >
                  <Label>{t(($) => $.subscription.mockOutcome)}</Label>
                  {["success", "failure"].map((value) => (
                    <Radio key={value} value={value}>
                      <Radio.Content>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        {value === "success"
                          ? t(($) => $.subscription.mockSuccess)
                          : t(($) => $.subscription.mockFailure)}
                      </Radio.Content>
                    </Radio>
                  ))}
                </RadioGroup>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                {trialAvailable
                  ? t(($) => $.limits.trialTerms)
                  : t(($) => $.limits.renewalTerms)}
              </p>
            )}
            {mutation.isError && (
              <Alert status="danger">
                <Alert.Content>
                  <Alert.Title>
                    {t(($) => $.subscription.saveError)}
                  </Alert.Title>
                </Alert.Content>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap">
            <Button
              variant="secondary"
              className="flex-auto sm:flex-none"
              isDisabled={mutation.isPending}
              onPress={onClose}
            >
              {t(($) => $.limits.notNow)}
            </Button>
            <Button
              className="flex-auto sm:flex-none"
              isPending={mutation.isPending}
              isDisabled={mutation.isPending}
              onPress={() => {
                if (!checkout && !trialAvailable) setCheckout(true);
                else if (checkout && outcome === "failure") setDeclined(true);
                else mutation.mutate();
              }}
            >
              <CrownDiamond className="size-4" aria-hidden="true" />
              {checkout
                ? t(($) => $.subscription.confirmMock)
                : trialAvailable
                  ? t(($) => $.limits.startTrial)
                  : t(($) => $.limits.continuePayment)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ActiveDogDialog({
  onUpgrade,
  onSaved,
}: {
  onUpgrade: () => void;
  onSaved: (data: Subscription) => Promise<void>;
}) {
  const { t } = useTranslation();
  const { user } = useSession();
  const dogs = useQuery(dogChoicesQueryOptions(user?.id));
  const [selected, setSelected] = useState("");
  const [invalid, setInvalid] = useState(false);
  const mutation = useMutation({
    mutationFn: chooseActiveDog,
    onSuccess: onSaved,
  });
  return (
    <Modal.Backdrop isOpen isDismissable={false} isKeyboardDismissDisabled>
      <Modal.Container scroll="outside">
        <Modal.Dialog className="bg-background sm:max-w-2xl">
          <Modal.Header>
            <Modal.Heading className="text-2xl font-semibold tracking-tight">
              {t(($) => $.limits.plusEnded)}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <p>{t(($) => $.limits.chooseDogDescription)}</p>
            {dogs.isPending && <p role="status">{t(($) => $.dogs.loading)}</p>}
            {dogs.isError && (
              <Button variant="secondary" onPress={() => void dogs.refetch()}>
                {t(($) => $.dogs.retry)}
              </Button>
            )}
            {dogs.data && (
              <RadioGroup
                aria-label={t(($) => $.limits.activeDog)}
                value={selected}
                onChange={(value) => {
                  setSelected(value);
                  setInvalid(false);
                }}
                isDisabled={mutation.isPending}
                isInvalid={invalid}
              >
                {dogs.data.map((dog) => (
                  <Radio
                    key={dog.id}
                    value={dog.id}
                    aria-label={dog.name}
                    className="w-full"
                  >
                    <Radio.Content className="w-full gap-3 rounded-xl border border-border p-4 data-[selected=true]:border-accent">
                      <Radio.Control>
                        <Radio.Indicator />
                      </Radio.Control>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Label>{dog.name}</Label>
                        <Description>
                          {dog.breed && `${dog.breed} · `}
                          {t(($) => $.limits.unfinishedGoals, {
                            count: dog.unfinishedGoals,
                          })}
                        </Description>
                      </div>
                      <DogAvatar dog={dog} />
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
            )}
            {invalid && (
              <p role="alert" className="text-sm text-danger">
                {t(($) => $.limits.chooseDogError)}
              </p>
            )}
            <Description>{t(($) => $.limits.choicePermanent)}</Description>
            {mutation.isError && (
              <p role="alert" className="text-danger">
                {t(($) => $.subscription.saveError)}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer className="flex-wrap">
            <Button
              variant="secondary"
              className="flex-auto sm:flex-none"
              isPending={mutation.isPending}
              isDisabled={mutation.isPending}
              onPress={() => {
                if (!selected) setInvalid(true);
                else mutation.mutate(selected);
              }}
            >
              {t(($) => $.limits.confirmDog)}
            </Button>
            <Button
              className="flex-auto sm:flex-none"
              isDisabled={mutation.isPending}
              onPress={onUpgrade}
            >
              <CrownDiamond className="size-4" aria-hidden="true" />
              {t(($) => $.limits.renew)}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
