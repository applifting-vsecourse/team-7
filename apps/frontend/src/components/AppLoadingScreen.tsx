import { ArrowRotateRight } from "@gravity-ui/icons";

export function AppLoadingScreen() {
  return (
    <div className="grid min-h-svh place-content-center">
      <ArrowRotateRight className="size-8 animate-spin text-muted" />
    </div>
  );
}
