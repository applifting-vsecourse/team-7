import * as React from "react";
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "react-email";
import { emailMessages, type EmailLanguage } from "@/core/email/messages";
import { emailTheme as theme } from "@/core/email/theme";

interface EmailLayoutProps {
  language: EmailLanguage;
  preview: string;
  heading: string;
  description: string;
  button: string;
  url: string;
  footer: string;
  label?: string;
  encouragement?: string;
  children?: React.ReactNode;
}

export const EmailLayout = ({
  language,
  preview,
  heading,
  description,
  button,
  url,
  footer,
  label,
  encouragement,
  children,
}: EmailLayoutProps): React.JSX.Element => {
  return (
    <Html lang={language}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/files/inter-latin-400-normal.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <style>{`
          @font-face {
            font-family: 'Inter';
            font-style: normal;
            font-weight: 400;
            src: url('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.3.0/files/inter-latin-ext-400-normal.woff2') format('woff2');
            unicode-range: U+0100-024F, U+1E00-1EFF;
          }
          @font-face {
            font-family: 'Lily Script One';
            font-style: normal;
            font-weight: 400;
            src: url('https://cdn.jsdelivr.net/npm/@fontsource/lily-script-one@5.3.0/files/lily-script-one-latin-400-normal.woff2') format('woff2');
          }
          @media only screen and (max-width: 600px) {
            .email-content > tbody > tr > td { padding: 32px 24px !important; }
            .email-button { box-sizing: border-box !important; text-align: center !important; width: 100% !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body lang={language} style={styles.body}>
        <Container style={styles.container}>
          <Section className="email-content" style={styles.content}>
            <Text style={styles.wordmark}>TrainLoop</Text>
            <Text style={styles.tagline}>
              {emailMessages[language].tagline}
            </Text>
            <Hr style={styles.divider} />
            {label && <Text style={styles.label}>{label}</Text>}
            <Heading as="h1" style={styles.heading}>
              {heading}
            </Heading>
            <Text style={styles.description}>{description}</Text>
            {children}
            <Section style={styles.action}>
              <Button className="email-button" href={url} style={styles.button}>
                {button}
              </Button>
            </Section>
            {encouragement && (
              <Text style={styles.encouragement}>{encouragement}</Text>
            )}
            <Hr style={styles.divider} />
            <Text style={styles.footer}>{footer}</Text>
            <Text style={styles.fallback}>
              {emailMessages[language].fallbackLink}
              <br />
              <Link href={url} style={styles.fallbackLink}>
                {url}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    margin: 0,
    padding: "24px 0",
    backgroundColor: theme.background,
    color: theme.foreground,
    fontFamily: theme.fontSans,
  },
  container: {
    width: "100%",
    maxWidth: 560,
    margin: "0 auto",
    backgroundColor: theme.surface,
    borderTop: `4px solid ${theme.accent}`,
  },
  content: { padding: "40px 40px" },
  wordmark: {
    margin: 0,
    fontFamily: theme.fontLogo,
    fontSize: 32,
    lineHeight: "40px",
    fontWeight: 400,
    letterSpacing: "-0.5px",
  },
  tagline: {
    margin: "8px 0 32px",
    color: theme.muted,
    fontSize: 12,
    lineHeight: "20px",
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${theme.border}`,
    margin: "0 0 32px",
  },
  label: {
    margin: "0 0 12px",
    fontSize: 14,
    lineHeight: "20px",
    color: theme.muted,
    fontWeight: 600,
  },
  heading: {
    margin: "0 0 16px",
    fontSize: 24,
    lineHeight: "32px",
    fontWeight: 600,
    letterSpacing: "-0.7px",
    color: theme.foreground,
  },
  description: {
    margin: 0,
    fontSize: 16,
    lineHeight: "26px",
    color: theme.foreground,
  },
  action: { padding: "32px 0 24px" },
  button: {
    backgroundColor: theme.accent,
    color: theme.accentForeground,
    borderRadius: theme.radius,
    padding: "16px 24px",
    fontFamily: theme.fontSans,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: "24px",
    textDecoration: "none",
  },
  encouragement: {
    margin: "0 0 32px",
    fontSize: 14,
    lineHeight: "22px",
    color: theme.muted,
  },
  footer: {
    margin: "0 0 16px",
    fontSize: 12,
    lineHeight: "20px",
    color: theme.muted,
  },
  fallback: { margin: 0, fontSize: 12, lineHeight: "20px", color: theme.muted },
  fallbackLink: {
    color: theme.foreground,
    textDecoration: "underline",
    overflowWrap: "anywhere",
  },
} satisfies Record<string, React.CSSProperties>;
