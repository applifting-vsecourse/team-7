import { Alert } from "@heroui/react";

export function SettingsError({ children }: { children: string }) {
  return (
    <Alert status="danger" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{children}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
