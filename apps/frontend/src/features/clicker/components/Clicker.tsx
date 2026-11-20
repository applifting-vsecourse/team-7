import { useEffect, useState } from "react";
import {
  ArrowRotateLeft,
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  Stopwatch,
  Xmark,
} from "@gravity-ui/icons";
import { Button, Dropdown, Label, Modal } from "@heroui/react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { useSession } from "@/features/auth/hooks/useSession";
import { ScheduledExerciseDialog } from "@/features/events/components/ScheduledExerciseDialog";

import { clickerAtom, formatTimer, measure } from "../atoms/clickerAtom";
import { clickerFeedback } from "../lib/feedback";

export function Clicker() {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const [session, setSession] = useAtom(clickerAtom);
  const [now, setNow] = useState(Date.now);
  const [discard, setDiscard] = useState(false);
  const hasSession = Boolean(session);
  const running = Boolean(session && session.view !== "review");
  const full = session?.view === "full";

  useEffect(() => {
    if (!session) return;
    if (!user || user.id !== session.userId) setSession(null);
  }, [user, session, setSession]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!hasSession) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasSession]);

  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let disposed = false;
    const request = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (disposed) await acquired.release();
        else lock = acquired;
      } catch {
        /* Unsupported or denied: counting remains available. */
      }
    };
    void request();
    const onVisible = () => {
      void request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      void lock?.release();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [running]);

  useEffect(() => {
    if (!full || discard) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      if (
        (event.target as HTMLElement)?.closest(
          "button, input, textarea, [role=menu], [role=menuitem], [contenteditable=true]",
        )
      ) {
        return;
      }
      event.preventDefault();
      clickerFeedback(true);
      setSession((current) =>
        current && current.attempts.length < 1000000
          ? { ...current, attempts: [...current.attempts, true] }
          : current,
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full, discard, setSession]);

  if (!session || session.userId !== user?.id) return null;
  const result = measure(session, now);
  const minimize = () =>
    setSession((current) => current && { ...current, view: "minimized" });
  const resume = () =>
    setSession(
      (current) =>
        current && {
          ...current,
          view: "full",
          startedAt:
            current.elapsedSeconds === undefined
              ? current.startedAt
              : Date.now() - current.elapsedSeconds * 1000,
          elapsedSeconds: undefined,
        },
    );
  const attempt = (success: boolean) => {
    clickerFeedback(success);
    setSession((current) =>
      current && current.attempts.length < 1000000
        ? { ...current, attempts: [...current.attempts, success] }
        : current,
    );
  };

  if (session.view === "review") {
    return (
      <ScheduledExerciseDialog
        key={`${session.event.id}-${session.startedAt}`}
        event={session.event}
        initialMeasurement={measure(session)}
        onClose={resume}
        onSaved={() => setSession(null)}
        onStartClicker={() => undefined}
      />
    );
  }

  if (session.view === "minimized") {
    return (
      <div className="pointer-events-none fixed inset-x-2 bottom-2 z-50 flex justify-center md:bottom-6">
        <Button
          className="pointer-events-auto h-auto min-h-19 w-full max-w-120 justify-start gap-3 px-4 py-3 text-left"
          onPress={resume}
          aria-label={t(($) => $.clicker.resume)}
        >
          <Stopwatch className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col whitespace-normal">
            <span className="font-semibold">
              {session.event.exercise?.name}
            </span>
            <span className="text-sm font-normal">
              {t(($) => $.clicker.barSummary, {
                dog: session.event.dog.name,
                successful: result.successfulAttempts,
                total: result.totalAttempts,
              })}
            </span>
          </span>
          <span className="text-xl tabular-nums">
            {formatTimer(result.elapsedSeconds)}
          </span>
          <ChevronUp className="size-5 shrink-0" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <Modal.Backdrop
      isOpen
      isDismissable={false}
      onOpenChange={(open) => {
        if (!open) minimize();
      }}
    >
      <Modal.Container size="full" scroll="outside">
        <Modal.Dialog
          className="clicker-screen bg-background"
          aria-label={t(($) => $.clicker.title)}
        >
          <div className="flex w-full items-center gap-3">
            <Button
              variant="tertiary"
              isIconOnly
              aria-label={t(($) => $.clicker.minimize)}
              onPress={minimize}
            >
              <ChevronDown className="size-4" aria-hidden="true" />
            </Button>
            <div className="min-w-0 flex-1 text-center">
              <Modal.Heading className="text-base leading-7 font-semibold">
                {session.event.exercise?.name}
              </Modal.Heading>
              <p className="text-sm leading-6 text-muted">
                {t(($) => $.clicker.context, {
                  dog: session.event.dog.name,
                  discipline: session.event.exercise?.goal.discipline.name,
                })}
              </p>
            </div>
            <Dropdown>
              <Button
                variant="tertiary"
                isIconOnly
                aria-label={t(($) => $.training.menu)}
              >
                <EllipsisVertical className="size-4" aria-hidden="true" />
              </Button>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu onAction={() => setDiscard(true)}>
                  <Dropdown.Item
                    id="discard"
                    variant="danger"
                    textValue={t(($) => $.clicker.discard)}
                  >
                    <Xmark className="size-4" aria-hidden="true" />
                    <Label>{t(($) => $.clicker.discard)}</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
          <div className="flex w-full max-w-120 flex-1 flex-col gap-6 self-center">
            <div className="flex flex-col gap-1 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm leading-6 text-muted">
                <Stopwatch
                  className="size-4 text-foreground"
                  aria-hidden="true"
                />
                {t(($) => $.clicker.time)}
              </p>
              <p className="text-clicker-timer font-semibold tabular-nums">
                {formatTimer(result.elapsedSeconds)}
              </p>
            </div>
            <dl
              className="grid grid-cols-3 gap-2 text-center"
              aria-live="polite"
            >
              {[
                [t(($) => $.clicker.successful), result.successfulAttempts],
                [t(($) => $.clicker.attempts), result.totalAttempts],
                [
                  t(($) => $.clicker.rate),
                  result.totalAttempts
                    ? new Intl.NumberFormat(i18n.resolvedLanguage, {
                        style: "percent",
                        maximumFractionDigits: 0,
                      }).format(
                        result.successfulAttempts / result.totalAttempts,
                      )
                    : t(($) => $.clicker.noRate),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dd className="text-3xl leading-9 font-semibold tabular-nums">
                    {value}
                  </dd>
                  <dt className="text-sm leading-6 text-muted">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="flex flex-1 flex-col gap-3">
              <Button
                variant="tertiary"
                className="h-30 w-full shrink-0 flex-col gap-1"
                onPress={() => attempt(false)}
              >
                <span className="text-3xl font-semibold">
                  {t(($) => $.clicker.addAttempt)}
                </span>
                <span className="text-base font-normal">
                  {t(($) => $.clicker.unsuccessfulAttempt)}
                </span>
              </Button>
              <Button
                className="h-auto min-h-48 w-full flex-1 flex-col gap-1"
                onPress={() => attempt(true)}
              >
                <span className="text-clicker-action font-semibold">
                  {t(($) => $.clicker.click)}
                </span>
                <span className="text-base font-normal">
                  {t(($) => $.clicker.successfulAttempt)}
                </span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="ghost"
                className="flex-auto sm:flex-none"
                isDisabled={!session.attempts.length}
                onPress={() =>
                  setSession(
                    (current) =>
                      current && {
                        ...current,
                        attempts: current.attempts.slice(0, -1),
                      },
                  )
                }
              >
                <ArrowRotateLeft className="size-4" aria-hidden="true" />
                {t(($) => $.clicker.undoLast)}
              </Button>
              <Button
                variant="secondary"
                className="flex-auto"
                onPress={() =>
                  setSession(
                    (current) =>
                      current && {
                        ...current,
                        elapsedSeconds: measure(current).elapsedSeconds,
                        view: "review",
                      },
                  )
                }
              >
                {t(($) => $.clicker.finish)}
              </Button>
            </div>
          </div>
          {discard && (
            <Modal.Backdrop isOpen onOpenChange={setDiscard}>
              <Modal.Container size="lg" scroll="outside">
                <Modal.Dialog className="bg-background">
                  <Modal.CloseTrigger
                    aria-label={t(($) => $.training.cancel)}
                  />
                  <Modal.Header>
                    <Modal.Icon>
                      <Xmark
                        className="size-4 text-danger"
                        aria-hidden="true"
                      />
                    </Modal.Icon>
                    <Modal.Heading>
                      {t(($) => $.clicker.discardTitle)}
                    </Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      {t(($) => $.clicker.discardDescription, {
                        successful: result.successfulAttempts,
                        total: result.totalAttempts,
                      })}
                    </p>
                  </Modal.Body>
                  <Modal.Footer className="flex-wrap">
                    <Button
                      variant="secondary"
                      className="flex-auto sm:flex-none"
                      onPress={() => setDiscard(false)}
                    >
                      {t(($) => $.clicker.continue)}
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-auto sm:flex-none"
                      onPress={() => {
                        setDiscard(false);
                        setSession(null);
                      }}
                    >
                      {t(($) => $.clicker.discard)}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
