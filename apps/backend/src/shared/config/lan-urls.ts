import { networkInterfaces } from "node:os";

// Container and VM bridges aren't reachable from a phone on the same Wi-Fi.
const VIRTUAL_INTERFACE = /^(docker|br-|veth|virbr|vmnet|vboxnet)/;

/**
 * URLs for opening `url` from other devices on the local network: the same
 * protocol and port on each of this machine's LAN IPv4 addresses. Shown in the
 * dev startup log so anyone can open the app on their phone.
 */
export function lanUrls(
  url: string,
  interfaces: ReturnType<typeof networkInterfaces> = networkInterfaces(),
): string[] {
  const base = new URL(url);
  return Object.entries(interfaces)
    .filter(([name]) => !VIRTUAL_INTERFACE.test(name))
    .flatMap(([, addresses]) => addresses ?? [])
    .filter((address) => address.family === "IPv4" && !address.internal)
    .map((address) => {
      const lan = new URL(base);
      lan.hostname = address.address;
      return lan.origin;
    });
}
