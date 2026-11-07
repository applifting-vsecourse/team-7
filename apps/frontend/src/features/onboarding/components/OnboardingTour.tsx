import { type ReactNode, useEffect, useRef } from "react";
import {
  Button,
  CloseButton,
  Popover,
  type PopoverContentProps,
  toast,
  useMediaQuery,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { ROUTES } from "@/app/routes";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogsQueryOptions } from "@/features/dogs/api/dogsQueryOptions";

import { installGuideOpenAtom } from "../atoms/installGuideOpenAtom";
import { type Box, useTargetBox } from "../hooks/useTargetBox";
import { useTour } from "../hooks/useTour";
import { canPromptInstall, isIos, promptInstall } from "../lib/install";
import { STEPS } from "../lib/steps";

// Figma spotlight: the hole leaves 4px around the target, the accent ring
// sits 2px further out.
const HOLE = 4;
const RING = 6;

const grow = (box: Box, by: number): Box => ({
  x: box.x - by,
  y: box.y - by,
  width: box.width + by * 2,
  height: box.height + by * 2,
});
const place = (box: Box) => ({
  left: box.x,
  top: box.y,
  width: box.width,
  height: box.height,
});

/** The backdrop with a rounded hole: clicks outside it do nothing. */
function holePath({ x, y, width: w, height: h }: Box, vw: number, vh: number) {
  const r = 10;
  return `path(evenodd, "M0 0H${vw}V${vh}H0Z M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z")`;
}

type Bubble = {
  label: string;
  title: string;
  body: ReactNode;
  onClose: () => void;
  footer: ReactNode;
};

/**
 * The first-login tour (#72, Figma "Přehled · Onboarding (průvodce)"): the
 * screen dims, the next thing to use is highlighted and a Coach Mark explains
 * it. Action steps wait for the user to use the highlighted element.
 */
export function OnboardingTour() {
  const { t } = useTranslation();
  const tour = useTour();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const menuOpen = useAtomValue(mobileSidebarOpenAtom);
  const [installGuide, setInstallGuide] = useAtom(installGuideOpenAtom);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useSession();
  const dogs = useQuery(dogsQueryOptions(user?.id));
  const anchorRef = useRef<HTMLDivElement>(null);

  const step = tour.step ?? (installGuide ? "install" : null);
  const config = step ? STEPS[step] : null;
  // On phones a sidebar target is reached through the ☰ menu first (O2b).
  const viaMenu = isMobile && !!config?.inMenu && !menuOpen;
  const target = viaMenu
    ? "menu"
    : step === "event"
      ? null
      : (config?.target ?? null);
  const selector =
    step === "event" && tour.data?.eventId
      ? `[data-event-id="${tour.data.eventId}"]`
      : target && `[data-tour="${target}"]`;
  const { box, missing, modalOpen, viewport } = useTargetBox(selector, !!step);

  const dogId = tour.data?.dogId;
  // A dog page stays as it is: right after adding a dog, the tour's dog is
  // still being refetched, while the page already shows the new one.
  const pageDogId = /^\/dogs\/(?!archive$)([^/]+)$/.exec(pathname)?.[1];
  const page =
    config?.page === "calendar"
      ? ROUTES.calendar
      : config?.page === "dog" && dogId && !pageDogId
        ? `/dogs/${dogId}`
        : null;

  // Info and action steps happen on their own page; resuming opens it.
  useEffect(() => {
    if (!tour.step || !page || tour.isFetching || pathname === page) return;
    void navigate(
      page === ROUTES.calendar
        ? { to: ROUTES.calendar }
        : { to: ROUTES.dog, params: { dogId: dogId! } },
    );
  }, [tour.step, page, pathname, tour.isFetching, navigate, dogId]);

  // Resumed on a device without that step (install is phone-only).
  useEffect(() => {
    if (
      tour.step &&
      tour.step !== "welcome" &&
      !tour.steps.includes(tour.step)
    ) {
      tour.finish();
    }
  }, [tour]);

  // "Open the calendar" is done once the calendar is open.
  useEffect(() => {
    if (tour.step === "openCalendar" && pathname === ROUTES.calendar) {
      tour.next();
    }
  }, [tour, pathname]);

  // The next step confirms an action instead of a toast (spec).
  useEffect(() => {
    if (!tour.step) return;
    const queue = toast.getQueue();
    const clear = () => {
      if (queue.visibleToasts.length) toast.clear();
    };
    clear();
    return queue.subscribe(clear);
  }, [tour.step]);

  const closeInstall = () => {
    if (tour.step) tour.finish();
    else setInstallGuide(false);
  };
  const leave = step === "install" ? closeInstall : tour.leave;

  useEffect(() => {
    if (!step || modalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leave();
    };
    // Capture: the popover handles Escape itself and stops it.
    addEventListener("keydown", onKey, true);
    return () => removeEventListener("keydown", onKey, true);
  }, [step, modalOpen, leave]);

  if (!step || !config || modalOpen) return null;
  // Wait for the target unless it has gone missing (then centre the bubble).
  if (selector && !box && !missing) return null;

  const position = tour.steps.indexOf(step) + 1;
  const label =
    step === "welcome" || !tour.step
      ? t(($) => $.onboarding.label)
      : t(($) => $.onboarding.stepOf, {
          current: position,
          total: tour.steps.length,
        });
  const isLast = position === tour.steps.length;
  const skip = (
    <Button size="sm" variant="ghost" onPress={leave}>
      {step === "install"
        ? t(($) => $.onboarding.later)
        : t(($) => $.onboarding.skip)}
    </Button>
  );
  const back = config.back && tour.step && (
    <Button size="sm" variant="secondary" onPress={() => tour.go(config.back!)}>
      {t(($) => $.onboarding.back)}
    </Button>
  );
  const footer = (primary?: ReactNode) => (
    <>
      {skip}
      <span className="flex-1" />
      {back}
      {primary}
    </>
  );
  const nextButton = (
    <Button size="sm" onPress={tour.next}>
      {isLast ? t(($) => $.onboarding.finish) : t(($) => $.onboarding.next)}
    </Button>
  );

  const ios = isIos();
  const dogName =
    dogs.data?.find((dog) => dog.id === (pageDogId ?? dogId))?.name ?? "";
  const touch = isMobile ? "bodyTouch" : "body";
  const bubble: Bubble = {
    label,
    onClose: leave,
    ...(step === "welcome"
      ? {
          title: t(($) => $.onboarding.steps.welcome.title),
          body: t(($) => $.onboarding.steps.welcome.body),
          footer: footer(
            <Button size="sm" onPress={() => tour.go("addDog")}>
              {t(($) => $.onboarding.start)}
            </Button>,
          ),
        }
      : step === "addDog" && viaMenu
        ? {
            title: t(($) => $.onboarding.steps.menu.title),
            body: t(($) => $.onboarding.steps.menu.body),
            footer: footer(),
          }
        : step === "addDog"
          ? {
              title: t(($) => $.onboarding.steps.addDog.title),
              body: t(($) => $.onboarding.steps.addDog[touch]),
              footer: footer(),
            }
          : step === "dogProfile"
            ? {
                title: t(($) => $.onboarding.steps.dogProfile.title, {
                  name: dogName,
                }),
                body: t(($) => $.onboarding.steps.dogProfile.body),
                footer: footer(nextButton),
              }
            : step === "openCalendar"
              ? {
                  title: t(($) => $.onboarding.steps.openCalendar.title),
                  body: t(($) => $.onboarding.steps.openCalendar[touch]),
                  footer: footer(),
                }
              : step === "install" && ios
                ? {
                    title: t(($) => $.onboarding.steps.installIos.title),
                    body: (
                      <>
                        {t(($) => $.onboarding.steps.installIos.body)}
                        <ol className="list-decimal pl-5">
                          <li>
                            {t(($) => $.onboarding.steps.installIos.share)}
                          </li>
                          <li>
                            {t(($) => $.onboarding.steps.installIos.addToHome)}
                          </li>
                          <li>
                            {t(($) => $.onboarding.steps.installIos.confirm)}
                          </li>
                        </ol>
                      </>
                    ),
                    footer: footer(
                      <Button size="sm" onPress={closeInstall}>
                        {t(($) => $.onboarding.done)}
                      </Button>,
                    ),
                  }
                : step === "install"
                  ? {
                      title: t(($) => $.onboarding.steps.installAndroid.title),
                      body: t(($) => $.onboarding.steps.installAndroid.body),
                      footer: footer(
                        canPromptInstall() ? (
                          <Button
                            size="sm"
                            onPress={() =>
                              void promptInstall().finally(closeInstall)
                            }
                          >
                            {t(($) => $.onboarding.install)}
                          </Button>
                        ) : (
                          <Button size="sm" onPress={closeInstall}>
                            {t(($) => $.onboarding.done)}
                          </Button>
                        ),
                      ),
                    }
                  : {
                      // assignDiscipline, schedule, event, views
                      title: t(($) => $.onboarding.steps[step].title),
                      body: t(($) => $.onboarding.steps[step].body),
                      footer: footer(config.action ? undefined : nextButton),
                    }),
  };

  // O3 highlights the whole page; its bubble sits in the middle (Placement None).
  const centred = !box || step === "dogProfile";
  // iPhone: the arrow points down to Safari's Share button (O10); Android has
  // the same bottom bubble without an arrow (O11).
  const bottom = step === "install";
  const placement: PopoverContentProps["placement"] = bottom
    ? "top"
    : centred
      ? "bottom"
      : (isMobile && config.mobilePlacement) || config.placement;
  const anchor = bottom
    ? {
        left: viewport.width / 2,
        top: viewport.height - 16,
        width: 0,
        height: 0,
      }
    : centred
      ? {
          left: viewport.width / 2,
          top: viewport.height / 2,
          width: 0,
          height: 0,
        }
      : place(grow(box, HOLE));

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-60 touch-none bg-backdrop"
        style={{
          clipPath: box
            ? holePath(grow(box, HOLE), viewport.width, viewport.height)
            : undefined,
        }}
      />
      {box && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-60 rounded-xl border-2 border-accent"
          style={place(grow(box, RING))}
        />
      )}
      <div
        ref={anchorRef}
        aria-hidden="true"
        className="pointer-events-none fixed"
        style={anchor}
      />
      <Popover.Content
        // Re-placed when the target moves; the popover doesn't follow it.
        key={`${step}-${target}-${anchor.left}-${anchor.top}-${anchor.width}`}
        triggerRef={anchorRef}
        isOpen
        isNonModal
        placement={placement}
        shouldFlip={!centred}
        offset={centred && !bottom ? 0 : 12}
        className={
          centred && !bottom
            ? "z-70 w-coach-mark max-w-[calc(100vw-2rem)] -translate-y-1/2"
            : "z-70 w-coach-mark max-w-[calc(100vw-2rem)]"
        }
      >
        {(!centred || (bottom && ios)) && <Popover.Arrow />}
        <CoachMark {...bubble} />
      </Popover.Content>
    </>,
    document.body,
  );
}

/** Figma "Coach Mark" (662:29645): step, title, text, Skip / Back / Next. */
function CoachMark({ label, title, body, onClose, footer }: Bubble) {
  const { t } = useTranslation();
  return (
    <Popover.Dialog className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="flex-1 text-xs leading-5 text-muted">{label}</p>
        <CloseButton
          aria-label={t(($) => $.onboarding.close)}
          onPress={onClose}
        />
      </div>
      <Popover.Heading className="text-xl leading-7 font-semibold tracking-tight">
        {title}
      </Popover.Heading>
      <div className="flex flex-col gap-2 text-sm leading-6 text-muted">
        {body}
      </div>
      <div className="flex items-center gap-2 pt-2">{footer}</div>
    </Popover.Dialog>
  );
}
