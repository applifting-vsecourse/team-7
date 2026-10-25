import { useTranslation } from "react-i18next";

export function LastTraining({ date }: { date: string | null }) {
  const { t, i18n } = useTranslation();
  if (!date) return <>{t(($) => $.dogProfile.noTraining)}</>;
  return (
    <time dateTime={date}>
      {t(($) => $.dogProfile.lastTraining, {
        date: new Intl.DateTimeFormat(i18n.resolvedLanguage ?? "cs", {
          dateStyle: "medium",
        }).format(new Date(date)),
      })}
    </time>
  );
}
