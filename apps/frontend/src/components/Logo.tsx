import { VectorCircle } from "@gravity-ui/icons";

const sizes = {
  // Header: icon and wordmark follow the surrounding text size.
  md: { icon: "size-4", text: "" },
  // Figma "Logo" component (8:887): 40px icon, text-3xl wordmark.
  lg: { icon: "size-10", text: "text-3xl leading-8" },
};

type LogoProps = {
  size?: keyof typeof sizes;
  iconOnly?: boolean;
};

export function Logo({ size = "md", iconOnly = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <VectorCircle className={`shrink-0 text-accent ${sizes[size].icon}`} />
      <span
        className={`${iconOnly ? "sr-only" : ""} font-lily font-normal ${sizes[size].text}`}
      >
        TrainLoop
      </span>
    </span>
  );
}
