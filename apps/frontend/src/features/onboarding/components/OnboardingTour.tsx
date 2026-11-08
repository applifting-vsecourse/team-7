import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { format, isSameWeek, parseISO } from "date-fns";
import { useAtom } from "jotai";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { mobileSidebarOpenAtom } from "@/app/atoms/mobileSidebarOpenAtom";
import { ROUTES } from "@/app/routes";
import { cn, transitionName } from "@/lib/utils";

import { useSession } from "@/features/auth/hooks/useSession";
import { dogsQueryOptions } from "@/features/dogs/api/dogsQueryOptions";
import { selectedDogIdsAtom } from "@/features/dogs/atoms/selectedDogIdsAtom";

import { installGuideOpenAtom } from "../atoms/installGuideOpenAtom";
import { type Box, useTargetBox } from "../hooks/useTargetBox";
import { useTour } from "../hooks/useTour";
import { homeScreenBrowser } from "../lib/install";
import { STEPS } from "../lib/steps";

// Figma spotlight: the hole leaves 4px around the target, the accent ring
// sits 2px further out.
const HOLE = 4;
const RING = 6;
// React Aria puts its overlays (the mobile menu drawer, popovers) at z-index
// 100000; the spotlight must cover an open menu and the bubble sits above it.
// Named for view transitions too: elements the app names (the active menu
// link, the calendar period) are drawn above the page while a page or week
// changes, so the tour's own layers need names to stay on top of them.
const BUBBLE_LAYER = { zIndex: 100002, ...transitionName("tour-bubble") };

/** The tour's motion token in ms (0 when motion is reduced). */
function tourDuration() {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-tour")
    .trim();
  return Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000) || 0;
}

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
  // Same commands for every hole (even a closed one) so it can glide.
  const r = Math.min(10, w / 2, h / 2);
  return `path(evenodd, "M0 0H${vw}V${vh}H0Z M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z")`;
}

/** What a Coach Mark shows and where; kept so the last one can animate out. */
type View = {
  key: string;
  bubble: Bubble;
  anchor: CSSProperties;
  placement: PopoverContentProps["placement"];
  centred: boolean;
  bottom: boolean;
  arrow: boolean;
  clipPath: string;
};

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
  const [menuOpen, setMenuOpen] = useAtom(mobileSidebarOpenAtom);
  const [installGuide, setInstallGuide] = useAtom(installGuideOpenAtom);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({
    select: (s) => s.location.search as { view?: string; date?: string },
  });
  const navigate = useNavigate();
  const { user } = useSession();
  const dogs = useQuery(dogsQueryOptions(user?.id));
  const anchorRef = useRef<HTMLDivElement>(null);
  // The Coach Mark on screen. Between steps it animates out with its own
  // text before the next one comes in; when the tour ends, the dimming fades.
  const [shown, setShown] = useState<View | null>(null);

  // The app's own pages only (not sign-in or the landing page).
  const appPage = /^\/(overview|calendar|disciplines|dogs)(\/|$)/.test(
    pathname,
  );
  const step = appPage
    ? (tour.step ?? (installGuide ? "install" : null))
    : null;
  const config = step ? STEPS[step] : null;
  // On phones a sidebar target is reached through the ☰ menu first (O2b).
  const viaMenu = isMobile && !!config?.inMenu && !menuOpen;
  // An own discipline (O5 "Vlastní disciplína") opens empty on its detail:
  // step 3 goes on there until the dog has a goal with an exercise.
  const ownDiscipline =
    step === "assignDiscipline" &&
    /^\/dogs\/[^/]+\/disciplines\/[^/]+$/.test(pathname);
  const target = viaMenu
    ? "menu"
    : ownDiscipline
      ? tour.data?.hasGoal
        ? "add-exercise"
        : "add-goal"
      : step === "event"
        ? null
        : (config?.target ?? null);
  // Step 6 waits for the planned exercise's id (it's refetched after saving).
  const selector =
    step === "event"
      ? `[data-event-id="${tour.data?.eventId ?? "pending"}"]`
      : target && `[data-tour="${target}"]`;
  const {
    box,
    anchor: anchorBox,
    last,
    settled,
    missing,
    modalOpen,
    viewport,
  } = useTargetBox(selector, !!step);
  // A new step's hole glides (CSS transition) from the old target to where
  // the new one comes to rest after scrolling into view. Once it's there the
  // hole follows the target on every frame, so it never trails a scroll.
  const [glide, setGlide] = useState({ selector, done: false });
  if (glide.selector !== selector) setGlide({ selector, done: false });
  const glideDone = glide.selector === selector && glide.done;
  useEffect(() => {
    if (!anchorBox || glideDone) return;
    const timer = setTimeout(
      () =>
        setGlide((current) =>
          current.selector === selector ? { selector, done: true } : current,
        ),
      tourDuration(),
    );
    return () => clearTimeout(timer);
  }, [anchorBox, glideDone, selector]);

  const dogId = tour.data?.dogId;
  // A dog page stays as it is: right after adding a dog, the tour's dog is
  // still being refetched, while the page already shows the new one.
  const pageDogId = /^\/dogs\/(?!archive(?:\/|$))([^/]+)/.exec(pathname)?.[1];
  const page =
    config?.page === "calendar"
      ? ROUTES.calendar
      : config?.page === "dog" && dogId && !pageDogId
        ? `/dogs/${dogId}`
        : null;

  // Step 6 highlights the planned exercise, which may be in another week:
  // the calendar moves to that week (week view) so its tile is on screen.
  const eventDate =
    tour.step === "event" && tour.data?.eventStartsAt
      ? format(parseISO(tour.data.eventStartsAt), "yyyy-MM-dd")
      : null;
  useEffect(() => {
    if (!eventDate || pathname !== ROUTES.calendar) return;
    const shown = search.date ? parseISO(search.date) : new Date();
    if (
      (search.view ?? "week") === "week" &&
      isSameWeek(shown, parseISO(eventDate), { weekStartsOn: 1 })
    ) {
      return;
    }
    void navigate({
      to: ROUTES.calendar,
      search: (prev) => ({ ...prev, view: "week", date: eventDate }),
      replace: true,
      // The calendar's own week slide, calmer for a move the user didn't make.
      viewTransition: {
        types: [
          eventDate < format(shown, "yyyy-MM-dd") ? "back" : "forward",
          "tour",
        ],
      },
    });
  }, [eventDate, pathname, search.view, search.date, navigate]);

  // The tour's dog must not be filtered out of the calendar it plans in.
  const [selectedDogs, setSelectedDogs] = useAtom(selectedDogIdsAtom);
  useEffect(() => {
    const planning =
      tour.step === "schedule" ||
      tour.step === "event" ||
      tour.step === "views";
    if (planning && dogId && selectedDogs && !selectedDogs.includes(dogId)) {
      setSelectedDogs([...selectedDogs, dogId]);
    }
  }, [tour.step, dogId, selectedDogs, setSelectedDogs]);

  // Info and action steps happen on their own page; resuming opens it.
  useEffect(() => {
    if (!tour.step || !page || tour.isFetching || pathname === page) return;
    void navigate(
      page === ROUTES.calendar
        ? { to: ROUTES.calendar }
        : { to: ROUTES.dog, params: { dogId: dogId! } },
    );
  }, [tour.step, page, pathname, tour.isFetching, navigate, dogId]);

  // The phone menu stays open after its action (e.g. adding a dog from it);
  // a step whose target is on the page closes it so it doesn't cover it.
  useEffect(() => {
    if (tour.step && !STEPS[tour.step].inMenu && menuOpen) setMenuOpen(false);
  }, [tour.step, menuOpen, setMenuOpen]);

  // The own discipline's first exercise completes step 3.
  useEffect(() => {
    if (ownDiscipline && tour.data?.hasExercise) tour.next();
  }, [ownDiscipline, tour]);

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

  // Not measured yet: a hole at 0,0 would grow out of the corner.
  if (step && viewport.width === 0) return null;
  if (!step || !config) {
    if (!shown) return null;
    // The tour has ended: the same dimming and bubble fade out, then go.
    return createPortal(
      <TourLayer
        overlayClassName="pointer-events-none fixed inset-0 z-100001 animate-undim bg-backdrop"
        clipPath={shown.clipPath}
        // Also fires for a zero-length animation (reduced motion).
        onOverlayAnimationEnd={() => setShown(null)}
        anchorRef={anchorRef}
        anchorStyle={shown.anchor}
        popover={shown}
        isOpen={false}
      />,
      document.body,
    );
  }
  // The dimming stays on screen the whole time (taking it away between steps
  // made the screen blink). Only the bubble and ring wait: for a dialog the
  // action opened, and for the next target unless it has gone missing.
  // One thing at a time: the last bubble leaves while the hole glides to the
  // next target, and only once it's there do the ring and bubble come in.
  const waiting = modalOpen || (!!selector && !missing && !glideDone);
  // Between steps the hole stays on the last target until the next one shows,
  // then glides there; without a target it closes into a point.
  const live =
    !selector || missing
      ? null
      : glideDone
        ? (box ?? last)
        : (anchorBox ?? settled ?? box);
  const centre = last
    ? { x: last.x + last.width / 2, y: last.y + last.height / 2 }
    : { x: viewport.width / 2, y: viewport.height / 2 };
  const hole = live
    ? grow(live, HOLE)
    : { x: centre.x, y: centre.y, width: 0, height: 0 };

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
  const back = config.back && tour.step && !ownDiscipline && (
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

  const browser = homeScreenBrowser();
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
            : ownDiscipline
              ? {
                  title: t(($) =>
                    tour.data?.hasGoal
                      ? $.onboarding.steps.ownExercise.title
                      : $.onboarding.steps.ownGoal.title,
                  ),
                  body: t(($) =>
                    tour.data?.hasGoal
                      ? $.onboarding.steps.ownExercise.body
                      : $.onboarding.steps.ownGoal.body,
                  ),
                  footer: footer(),
                }
              : step === "openCalendar"
                ? {
                    title: t(($) => $.onboarding.steps.openCalendar.title),
                    body: t(($) => $.onboarding.steps.openCalendar[touch]),
                    footer: footer(),
                  }
                : step === "install" && browser
                  ? {
                      title: t(($) => $.onboarding.steps.install.title),
                      body: (
                        <>
                          {t(($) => $.onboarding.steps.install.body)}
                          <ol className="list-decimal pl-5">
                            <li>
                              {t(
                                ($) =>
                                  $.onboarding.steps.install[browser].share,
                              )}
                            </li>
                            <li>
                              {t(
                                ($) => $.onboarding.steps.install[browser].add,
                              )}
                            </li>
                            <li>
                              {t(
                                ($) =>
                                  $.onboarding.steps.install[browser].confirm,
                              )}
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
                  : {
                      // assignDiscipline, schedule, event, views
                      title: t(($) => $.onboarding.steps[step].title),
                      body: t(($) => $.onboarding.steps[step].body),
                      footer: footer(config.action ? undefined : nextButton),
                    }),
  };

  // O3 highlights the whole page; its bubble sits in the middle (Placement None).
  const centred = !anchorBox || step === "dogProfile";
  // Bottom bubble (O10/O11). The arrow points down only where the button sits
  // at the bottom centre: Safari's Share, Edge's ⋯. Chrome's is at the top.
  const bottom = step === "install";
  const placement: PopoverContentProps["placement"] = bottom
    ? "top"
    : centred
      ? "bottom"
      : ownDiscipline
        ? target === "add-goal"
          ? "bottom end"
          : "bottom"
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
      : place(grow(anchorBox, HOLE));
  const clipPath = holePath(hole, viewport.width, viewport.height);
  const view: View = {
    // Re-placed only when the target has settled elsewhere (see
    // useTargetBox); the spotlight follows it on every frame.
    key: `${step}-${target}-${anchor.left}-${anchor.top}-${anchor.width}`,
    bubble,
    anchor,
    placement,
    centred,
    bottom,
    arrow:
      !centred ||
      (bottom &&
        (browser === "safari" || browser?.startsWith("edge") === true)),
    clipPath,
  };
  if (
    !waiting &&
    (shown?.key !== view.key ||
      shown.bubble.title !== view.bubble.title ||
      shown.bubble.label !== view.bubble.label ||
      shown.clipPath !== view.clipPath)
  ) {
    setShown(view);
  }
  // While the next step's target settles, the last bubble animates out.
  const popover = waiting ? shown : view;

  return createPortal(
    <TourLayer
      overlayClassName={cn(
        "fixed inset-0 animate-dim touch-none bg-backdrop",
        !glideDone && "tour-hole",
        // Under an open dialog, above everything (the phone menu) otherwise.
        modalOpen ? "z-99999" : "z-100001",
      )}
      clipPath={clipPath}
      ring={
        box &&
        !waiting && (
          <div
            // Each new target gets its ring settling onto it.
            key={`${step}-${target}`}
            aria-hidden="true"
            className="pointer-events-none fixed z-100001 animate-spotlight rounded-xl border-2 border-accent"
            style={{
              ...place(grow(box, RING)),
              ...transitionName("tour-ring"),
            }}
          />
        )
      }
      anchorRef={anchorRef}
      anchorStyle={popover?.anchor ?? anchor}
      popover={popover}
      isOpen={!waiting}
    />,
    document.body,
  );
}

function CoachMarkPopover({
  view,
  isOpen,
  triggerRef,
}: {
  view: View;
  isOpen: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    // The root supplies the kit's popover classes (surface, padding, arrow);
    // closing it plays the kit's exit animation.
    <Popover isOpen={isOpen}>
      <Popover.Content
        triggerRef={triggerRef}
        isOpen={isOpen}
        isNonModal
        style={BUBBLE_LAYER}
        placement={view.placement}
        shouldFlip={!view.centred}
        offset={view.centred && !view.bottom ? 0 : 12}
        className={cn(
          "coach-mark w-coach-mark max-w-[calc(100vw-2rem)]",
          view.centred && !view.bottom && "-translate-y-1/2",
        )}
      >
        {view.arrow && <Popover.Arrow />}
        <CoachMark {...view.bubble} />
      </Popover.Content>
    </Popover>
  );
}

/**
 * The dimming with its hole, the ring and the bubble. Both a running and an
 * ending tour render through it, so the same elements animate out.
 */
function TourLayer({
  overlayClassName,
  clipPath,
  onOverlayAnimationEnd,
  ring,
  anchorRef,
  anchorStyle,
  popover,
  isOpen,
}: {
  overlayClassName: string;
  clipPath: string;
  onOverlayAnimationEnd?: () => void;
  ring?: ReactNode;
  anchorRef: RefObject<HTMLDivElement | null>;
  anchorStyle: CSSProperties;
  popover: View | null;
  isOpen: boolean;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={overlayClassName}
        style={{ clipPath, ...transitionName("tour-dim") }}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) onOverlayAnimationEnd?.();
        }}
      />
      {ring}
      <div
        ref={anchorRef}
        aria-hidden="true"
        className="pointer-events-none fixed"
        style={anchorStyle}
      />
      {popover && (
        <CoachMarkPopover
          key={popover.key}
          view={popover}
          isOpen={isOpen}
          triggerRef={anchorRef}
        />
      )}
    </>
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
