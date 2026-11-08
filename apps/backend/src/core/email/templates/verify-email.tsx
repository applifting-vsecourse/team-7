import * as React from "react";
import { EmailLayout } from "@/core/email/components/email-layout";
import { emailMessages, type EmailLanguage } from "../messages";

export interface VerifyEmailProps {
  url: string;
  language?: EmailLanguage;
}

export const VerifyEmail = ({
  url,
  language = "cs",
}: VerifyEmailProps): React.JSX.Element => {
  const content = emailMessages[language].verifyEmail;
  return (
    <EmailLayout
      language={language}
      preview={content.preview}
      heading={content.heading}
      description={content.description}
      button={content.button}
      url={url}
      footer={content.disclaimer}
    />
  );
};

export default VerifyEmail;
