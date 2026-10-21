import { EllipsisVertical, Pencil, TrashBin } from "@gravity-ui/icons";
import { Button, Dropdown, Label } from "@heroui/react";
import { useTranslation } from "react-i18next";

/** The ⋮ menu with "Upravit" and "Smazat" on disciplines, goals and exercises. */
export function ItemMenu({
  label,
  size = "sm",
  onEdit,
  onDelete,
}: {
  label: string;
  size?: "sm" | "md";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Dropdown>
      <Button isIconOnly variant="ghost" size={size} aria-label={label}>
        <EllipsisVertical className="size-4" aria-hidden="true" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-60">
        <Dropdown.Menu
          onAction={(key) => (key === "edit" ? onEdit() : onDelete())}
        >
          <Dropdown.Item id="edit" textValue={t(($) => $.disciplines.edit)}>
            <Pencil className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <Label>{t(($) => $.disciplines.edit)}</Label>
          </Dropdown.Item>
          <Dropdown.Item
            id="delete"
            textValue={t(($) => $.disciplines.delete)}
            variant="danger"
          >
            <TrashBin
              className="size-4 shrink-0 text-danger"
              aria-hidden="true"
            />
            <Label>{t(($) => $.disciplines.delete)}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
