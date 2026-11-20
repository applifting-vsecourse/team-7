import * as React from "react";
import { EmailLayout } from "@/core/email/components/email-layout";
import { emailMessages, type EmailLanguage } from "../messages";

export function EmailChangeNotice({
  email,
  url,
  language,
}: {
  email: string;
  url: string;
  language: EmailLanguage;
}): React.JSX.Element {
  const content = emailMessages[language].emailChangeNotice;
  return (
    <EmailLayout
      language={language}
      preview={content.preview}
      heading={content.heading}
      description={content.description(email)}
      button={content.button}
      url={url}
      footer={content.disclaimer}
    />
  );
}
