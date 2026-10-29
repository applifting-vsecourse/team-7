import { useState, type Ref } from "react";
import { Eye, EyeSlash } from "@gravity-ui/icons";
import { Button, InputGroup } from "@heroui/react";
import { useTranslation } from "react-i18next";

type PasswordInputProps = {
  ref?: Ref<HTMLInputElement>;
  autoComplete?: string;
};

export function PasswordInput({ ref, autoComplete }: PasswordInputProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputGroup fullWidth>
      <InputGroup.Input
        ref={ref}
        autoComplete={autoComplete}
        type={isVisible ? "text" : "password"}
      />
      <InputGroup.Suffix className="pe-0">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={
            isVisible
              ? t(($) => $.auth.hidePassword)
              : t(($) => $.auth.showPassword)
          }
          onPress={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? (
            <EyeSlash className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
      </InputGroup.Suffix>
    </InputGroup>
  );
}
