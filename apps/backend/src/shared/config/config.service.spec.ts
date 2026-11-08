import { validateSync } from "class-validator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoStorageService } from "@/modules/videos/video-storage.service";

describe("Supabase configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("BETTER_AUTH_SECRET", "test-only-secret");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-only-storage-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([undefined, ""])(
    "accepts SUPABASE_URL=%s and disables video storage",
    async (url) => {
      vi.stubEnv("SUPABASE_URL", url);
      const { Config } = await import("./config.service.js");
      const config = new Config();

      expect(validateSync(config)).toEqual([]);
      const storage = new VideoStorageService(config);
      expect(storage.enabled).toBe(false);
      expect(() => storage.assertEnabled()).toThrow("not configured");
    },
  );

  it("accepts a valid Supabase URL and enables configured video storage", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    const { Config } = await import("./config.service.js");
    const config = new Config();

    expect(validateSync(config)).toEqual([]);
    expect(new VideoStorageService(config).enabled).toBe(true);
  });

  it.each(["invalid-url", " "])(
    "rejects a nonempty invalid SUPABASE_URL=%s",
    async (url) => {
      vi.stubEnv("SUPABASE_URL", url);
      const { Config } = await import("./config.service.js");

      expect(validateSync(new Config())).toEqual([
        expect.objectContaining({
          property: "supabaseUrl",
          constraints: expect.objectContaining({ isUrl: expect.any(String) }),
        }),
      ]);
    },
  );
});
