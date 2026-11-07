import * as React from "react";
import { EmailLayout } from "@/core/email/components/email-layout";
import { emailMessages, type EmailLanguage } from "../messages";

export interface DailyReminderProps {
  url: string;
  language?: EmailLanguage;
}

export const DailyReminder = ({
  url,
  language = "cs",
}: DailyReminderProps): React.JSX.Element => {
  const content = emailMessages[language].dailyReminder;
  return (
    <EmailLayout
      language={language}
      preview={content.subject}
      label={content.label}
      heading={content.heading}
      description={content.description}
      button={content.link}
      url={url}
      encouragement={content.encouragement}
      footer={content.footer}
    />
  );
};

export default DailyReminder;
