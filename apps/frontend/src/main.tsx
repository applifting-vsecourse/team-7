import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import "@/i18n";
import { Providers } from "@/app/Providers";

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  );
}
