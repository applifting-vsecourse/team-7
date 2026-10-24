import { Star, StarFill } from "@gravity-ui/icons";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  small = false,
}: {
  rating: number;
  small?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <span
      role="img"
      aria-label={t(($) => $.training.star, { count: rating })}
      className="flex gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const Icon = value <= Math.round(rating) ? StarFill : Star;
        return (
          <Icon
            key={value}
            aria-hidden="true"
            className={cn(
              small ? "size-4" : "size-6",
              value <= Math.round(rating) ? "text-warning" : "text-muted",
            )}
          />
        );
      })}
    </span>
  );
}
