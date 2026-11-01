import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";
import { emailMessages, type EmailLanguage } from "../messages";

export interface VerifyEmailProps {
  url: string;
  language?: EmailLanguage;
}

export const VerifyEmail = ({
  url,
  language = "cs",
}: VerifyEmailProps): React.JSX.Element => {
  const messages = emailMessages[language];
  const content = messages.verifyEmail;
  return (
    <Html lang={language}>
      <Head />
      <Preview>{content.preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans py-10">
          <Container className="bg-white rounded-lg mx-auto p-8 max-w-xl">
            <Heading className="text-2xl font-bold text-gray-900 m-0">
              {content.heading}
            </Heading>
            <Text className="text-gray-700 text-base leading-6 mt-4">
              {content.description}
            </Text>
            <Section className="text-center my-8">
              <Button
                href={url}
                className="bg-yellow-400 text-gray-900 font-semibold rounded-md px-6 py-3"
              >
                {content.button}
              </Button>
            </Section>
            <Text className="text-gray-600 text-sm leading-5">
              {messages.fallbackLink}
            </Text>
            <Text className="text-sm break-all">
              <Link href={url} className="text-blue-600 break-all">
                {url}
              </Link>
            </Text>
            <Hr className="border-gray-200 my-6" />
            <Text className="text-gray-400 text-xs">{content.disclaimer}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerifyEmail;
