import type { NetworkInterfaceInfo } from "node:os";
import { describe, expect, it } from "vitest";
import { lanUrls } from "./lan-urls";

const ipv4 = (address: string, internal = false) =>
  ({ address, family: "IPv4", internal }) as NetworkInterfaceInfo;
const ipv6 = (address: string) =>
  ({ address, family: "IPv6", internal: false }) as NetworkInterfaceInfo;

describe("lanUrls", () => {
  it("swaps the host for each LAN IPv4 address and keeps protocol and port", () => {
    expect(
      lanUrls("http://localhost:3050", {
        lo: [ipv4("127.0.0.1", true)],
        wlp2s0: [ipv4("192.168.0.80"), ipv6("fe80::1")],
        enp3s0: [ipv4("10.0.0.5")],
      }),
    ).toEqual(["http://192.168.0.80:3050", "http://10.0.0.5:3050"]);
  });

  it("skips container and VM bridges", () => {
    expect(
      lanUrls("http://localhost:3050", {
        docker0: [ipv4("172.17.0.1")],
        "br-4f2a": [ipv4("172.18.0.1")],
        virbr0: [ipv4("192.168.122.1")],
        wlan0: [ipv4("192.168.1.20")],
      }),
    ).toEqual(["http://192.168.1.20:3050"]);
  });

  it("returns nothing when the machine is offline", () => {
    expect(
      lanUrls("http://localhost:3050", { lo: [ipv4("127.0.0.1", true)] }),
    ).toEqual([]);
  });
});
