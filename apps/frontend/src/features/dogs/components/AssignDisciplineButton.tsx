import { ChevronDown, Plus } from "@gravity-ui/icons";
import { Button, Description, Dropdown, Label } from "@heroui/react";
import { useTranslation } from "react-i18next";

export function AssignDisciplineButton({
  onLibrary,
  onCreate,
  className,
}: {
  onLibrary: () => void;
  onCreate: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Dropdown>
      <Button className={className}>
        <Plus className="size-4" aria-hidden="true" />
        {t(($) => $.dogProfile.assignDiscipline)}
        <ChevronDown className="size-4" aria-hidden="true" />
      </Button>
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
