import { type PropsWithChildren } from "react";

export const OverviewEvents = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex flex-col items-start gap-8 self-stretch md:flex-row md:flex-wrap md:content-start">
      {children}
    </div>
  );
};
