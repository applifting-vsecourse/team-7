import type { PopoverContentProps } from "@heroui/react";

// The tour steps (Figma "Přehled · Onboarding (průvodce)", O1–O11). Ids are
// stored on the server, so a reload or another device resumes the same step.
export const STEP_IDS = [
  "welcome",
  "addDog",
  "dogProfile",
  "assignDiscipline",
  "openCalendar",
  "schedule",
  "event",
  "views",
  "install",
] as const;
export type StepId = (typeof STEP_IDS)[number];

type Placement = PopoverContentProps["placement"];

export type Step = {
  /** `data-tour` value of the highlighted element; none centres the bubble. */
  target?: string;
  // Coach Mark "Placement" names the arrow side; the popover names the bubble side.
  placement?: Placement;
  mobilePlacement?: Placement;
  /** Action step: no Next, the user uses the highlighted element. */
  action?: boolean;
  /** The action opens a dialog; the tour waits until it closes. */
  dialog?: boolean;
  /** On phones the target sits in the ☰ menu, highlighted first (O2b). */
  inMenu?: boolean;
  /** The page the step happens on; the tour opens it when needed. */
  page?: "dog" | "calendar";
  back?: StepId;
};

export const STEPS: Record<StepId, Step> = {
  welcome: {},
  addDog: {
    target: "add-dog",
    placement: "right",
    mobilePlacement: "bottom start",
    action: true,
    dialog: true,
    inMenu: true,
  },
  dogProfile: { target: "dog-profile", page: "dog", back: "addDog" },
  assignDiscipline: {
    target: "assign-discipline",
    placement: "bottom",
    action: true,
    dialog: true,
    page: "dog",
    back: "dogProfile",
  },
  openCalendar: {
    target: "nav-calendar",
    placement: "right",
    mobilePlacement: "bottom start",
    action: true,
    inMenu: true,
  },
  schedule: {
    target: "schedule",
    placement: "bottom end",
    mobilePlacement: "bottom",
    action: true,
    dialog: true,
    page: "calendar",
  },
  event: {
    target: "event",
    placement: "left",
    mobilePlacement: "bottom",
    page: "calendar",
    back: "schedule",
  },
  views: {
    target: "calendar-views",
    placement: "bottom",
    page: "calendar",
    back: "event",
  },
  install: { back: "views" },
};

/** The steps a user goes through: the install step is phone-only (O10/O11). */
export function tourSteps(withInstall: boolean): StepId[] {
  return STEP_IDS.filter(
    (id) => id !== "welcome" && (id !== "install" || withInstall),
  );
}
