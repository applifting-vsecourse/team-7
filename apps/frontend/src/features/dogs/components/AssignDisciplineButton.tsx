import { ChevronDown, Plus } from "@gravity-ui/icons";
import { Button, Description, Dropdown, Label } from "@heroui/react";
import { useTranslation } from "react-i18next";

export function AssignDisciplineButton({
  onLibrary,
  onCreate,
  onPress,
  className,
}: {
  onLibrary: () => void;
  onCreate: () => void;
  /** Skips the menu, e.g. in the tour, which opens its own dialog (O4). */
  onPress?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const button = (
    <Button
      className={className}
      data-tour="assign-discipline"
      onPress={onPress}
    >
      <Plus className="size-4" aria-hidden="true" />
      {t(($) => $.dogProfile.assignDiscipline)}
      <ChevronDown className="size-4" aria-hidden="true" />
    </Button>
  );
  if (onPress) return button;
  return (
    <Dropdown>
      {button}
      <Dropdown.Popover placement="bottom end" className="min-w-60">
        <Dropdown.Menu
          onAction={(key) => (key === "library" ? onLibrary() : onCreate())}
        >
          <Dropdown.Item
            id="library"
            textValue={t(($) => $.dogProfile.fromLibrary)}
          >
            <div className="flex flex-col">
              <Label>{t(($) => $.dogProfile.fromLibrary)}</Label>
              <Description>
                {t(($) => $.dogProfile.fromLibraryHint)}
              </Description>
            </div>
          </Dropdown.Item>
          <Dropdown.Item
            id="create"
            textValue={t(($) => $.disciplines.newDiscipline)}
          >
            <div className="flex flex-col">
              <Label>{t(($) => $.disciplines.newDiscipline)}</Label>
              <Description>
                {t(($) => $.dogProfile.newDisciplineHint)}
              </Description>
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
