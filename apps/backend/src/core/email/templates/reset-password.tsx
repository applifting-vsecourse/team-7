import * as React from "react";
import { EmailLayout } from "@/core/email/components/email-layout";
import { emailMessages, type EmailLanguage } from "../messages";

export interface ResetPasswordProps {
  language?: EmailLanguage;
  name: string;
  url: string;
}

export const ResetPassword = ({
  name,
  url,
  language = "cs",
}: ResetPasswordProps): React.JSX.Element => {
  const content = emailMessages[language].resetPassword;
  return (
    <EmailLayout
      language={language}
      preview={content.preview}
      heading={content.heading}
      description={content.description(name)}
      button={content.button}
      url={url}
      footer={content.disclaimer}
    />
  );
};

export default ResetPassword;
