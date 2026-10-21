import { useState } from "react";

/**
 * Which one of a component's dialogs is open. A single value keeps them
 * mutually exclusive; the dialogs open from menu items that unmount on select,
 * so the state has to live outside the menu.
 */
export function useDialogState<T extends string>() {
  const [dialog, setDialog] = useState<T | null>(null);
  return {
    dialog,
    open: setDialog,
    close: () => setDialog(null),
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) setDialog(null);
    },
  };
}
