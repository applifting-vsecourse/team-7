import type { ComponentType, SVGProps } from "react";
import { EllipsisVertical } from "@gravity-ui/icons";
import { Button, Description, Dropdown, Label } from "@heroui/react";

export type MenuAction = {
  id: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  hint?: string;
  danger?: boolean;
};

/**
 * The ⋮ menu of a dog's goal or exercise (Figma "Dropdown · Menu cíle"
 * 608:15075, "Menu cvičení" 608:15330): icon, label and an optional hint.
 */
export function ActionsMenu({
  label,
  actions,
  onAction,
  isDisabled,
  variant = "ghost",
}: {
  label: string;
  actions: MenuAction[];
  onAction: (id: string) => void;
  isDisabled?: boolean;
  variant?: "ghost" | "secondary";
}) {
  return (
    <Dropdown>
      <Button
        isIconOnly
        variant={variant}
        aria-label={label}
        isDisabled={isDisabled}
      >
        <EllipsisVertical className="size-4" aria-hidden="true" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="max-w-72 min-w-60">
        <Dropdown.Menu onAction={(key) => onAction(String(key))}>
          {actions.map(({ id, icon: Icon, label, hint, danger }) => (
            <Dropdown.Item
              key={id}
              id={id}
              textValue={label}
              variant={danger ? "danger" : undefined}
              className="items-start"
            >
              {/* h-5 = the label's line height, so the icon centres on it. */}
              <span className="flex h-5 shrink-0 items-center">
                <Icon
                  className={
                    danger ? "size-4 text-danger" : "size-4 text-muted"
                  }
                  aria-hidden="true"
                />
              </span>
              <div className="flex flex-col">
                <Label>{label}</Label>
                {hint && <Description>{hint}</Description>}
              </div>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
