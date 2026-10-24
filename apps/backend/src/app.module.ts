import { ConfigModule } from "@applifting-io/nestjs-decorated-config";
import { Module } from "@nestjs/common";
import { DisciplinesModule } from "./modules/disciplines/disciplines.module";
import { DogsModule } from "./modules/dogs/dogs.module";
import { EventsModule } from "./modules/events/events.module";
import { WelcomeModule } from "./modules/welcome/welcome.module";
import { AuthModule } from "./shared/auth/auth.module";
import { Config } from "./shared/config/config.service";

const imports = [
  EventsModule,
  ConfigModule.forRootAsync(Config, { validate: true }),
  AuthModule,
  DisciplinesModule,
  DogsModule,
  WelcomeModule,
];

@Module({
  imports,
})
export class AppModule {}
