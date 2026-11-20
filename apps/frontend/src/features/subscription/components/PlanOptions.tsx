import { Chip, Description, Label, Radio, RadioGroup } from "@heroui/react";
import { useTranslation } from "react-i18next";
export type BillingPeriod = "yearly" | "monthly";
export function PlanOptions({
  value,
  onChange,
  isDisabled = false,
}: {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  isDisabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <RadioGroup
      aria-label={t(($) => $.limits.plan)}
      value={value}
      onChange={(value) => onChange(value as BillingPeriod)}
      isDisabled={isDisabled}
      className="w-full"
      orientation="horizontal"
    >
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {(["yearly", "monthly"] as const).map((period) => (
          <Radio
            key={period}
            value={period}
            aria-label={
              period === "yearly"
                ? t(($) => $.limits.yearly)
                : t(($) => $.limits.monthly)
            }
            className="w-full"
          >
            <Radio.Content className="w-full items-start gap-3 rounded-xl border border-border p-4 data-[selected=true]:border-accent">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label>
                  {period === "yearly"
                    ? t(($) => $.limits.yearly)
                    : t(($) => $.limits.monthly)}
                </Label>
                <Description>
                  {period === "yearly"
                    ? t(($) => $.limits.yearlyDescription)
                    : t(($) => $.limits.monthlyDescription)}
                </Description>
              </div>
              {period === "yearly" && (
                <Chip color="success" size="sm" variant="soft">
                  <Chip.Label>{t(($) => $.limits.saving)}</Chip.Label>
                </Chip>
              )}
            </Radio.Content>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
