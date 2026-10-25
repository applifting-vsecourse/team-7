import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { RatingStars } from "@/features/events/components/RatingStars";

export function AverageRating({
  rating,
  emptyLabel,
  className,
}: {
  rating: number | null;
  emptyLabel: string;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      {rating === null ? (
        emptyLabel
      ) : (
        <>
          <span>
            {t(($) => $.exerciseDetail.ratingValue, {
              rating: new Intl.NumberFormat(i18n.resolvedLanguage ?? "cs", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(rating),
            })}
          </span>
          <RatingStars rating={Math.round(rating * 10) / 10} small />
        </>
      )}
    </span>
  );
}
