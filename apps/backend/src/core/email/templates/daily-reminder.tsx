import * as React from "react";
import { Heading, Section, Text } from "react-email";
import { EmailLayout } from "@/core/email/components/email-layout";
import { emailMessages, type EmailLanguage } from "../messages";

export interface DailyReminderDog {
  id: string;
  name: string;
  exercises: { id: string; name: string }[];
}

export interface DailyReminderProps {
  url: string;
  dogs: DailyReminderDog[];
  language?: EmailLanguage;
}

export const DailyReminder = ({
  url,
  dogs,
  language = "cs",
}: DailyReminderProps): React.JSX.Element => {
  const content = emailMessages[language].dailyReminder;
  const settingsUrl = new URL("/settings", url);
  settingsUrl.searchParams.set("lng", language);
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
      unsubscribeUrl={settingsUrl.toString()}
    >
      {dogs.map((dog) => (
        <Section key={dog.id} style={{ paddingTop: 24 }}>
          <Heading as="h2" style={{ margin: "0 0 8px", fontSize: 18 }}>
            {dog.name}
          </Heading>
          {dog.exercises.map((exercise) => (
            <Text
              key={exercise.id}
              style={{ margin: "4px 0", fontSize: 16, lineHeight: "26px" }}
            >
              {exercise.name}
            </Text>
          ))}
        </Section>
      ))}
    </EmailLayout>
  );
};

export default DailyReminder;
