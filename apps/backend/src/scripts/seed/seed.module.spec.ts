import { ConfigModule } from "@applifting-io/nestjs-decorated-config";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";
import { PrismaService } from "@/core/prisma/prisma.service";
import type { BetterAuth } from "@/shared/auth/providers/better-auth.provider";
import { EmailChangeService } from "@/shared/auth/services/email-change.service";
import { Config } from "@/shared/config/config.service";
import { SeedService } from "./seed.service";

describe("seed module dependency wiring", () => {
  it("resolves the real BetterAuth factory without connecting to the database or running the seed", async () => {
    const config = mock<Config>({
      backendUrl: "http://localhost:4050",
      frontendUrl: "http://localhost:3050",
      additionalFrontendOrigins: "",
    });
    // ConfigModule validates eagerly when SeedModule is imported. Supply a
    // test config here instead of depending on a developer's environment.
    const configure = vi.spyOn(ConfigModule, "forRootAsync").mockResolvedValue({
      module: ConfigModule,
      providers: [{ provide: Config, useValue: config }],
      exports: [Config],
    });
    try {
      const { SeedModule } = await import("./seed.module.js");
      const prisma = mockDeep<PrismaService>();
      const module = await Test.createTestingModule({ imports: [SeedModule] })
        .overrideProvider(Config)
        .useValue(config)
        .overrideProvider(PrismaService)
        .useValue(prisma)
        .compile();
      try {
        expect(module.get(EmailChangeService)).toBeInstanceOf(
          EmailChangeService,
        );
        expect(module.get(SeedService)).toBeInstanceOf(SeedService);
        expect(module.get<BetterAuth>("BetterAuth").api.changeEmail).toBeTypeOf(
          "function",
        );
        expect(prisma.$connect).not.toHaveBeenCalled();
        expect(prisma.user.create).not.toHaveBeenCalled();
      } finally {
        await module.close();
      }
    } finally {
      configure.mockRestore();
    }
  });
});
