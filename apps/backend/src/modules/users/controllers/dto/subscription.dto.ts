import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import {
  subscriptionActions,
  type SubscriptionAction,
} from "@/modules/users/domain/subscription";

export class SubscriptionActionDto {
  @ApiProperty({
    enum: subscriptionActions,
    description: "Simulated billing action; never charges a card",
  })
  @IsIn(subscriptionActions)
  action!: SubscriptionAction;
  @ApiProperty({ required: false, enum: ["yearly", "monthly"] })
  @IsOptional()
  @IsIn(["yearly", "monthly"])
  billingPeriod?: "yearly" | "monthly";
}

export class ActiveDogDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  dogId!: string;
}

export class SubscriptionDto {
  @ApiProperty({ enum: ["free", "trial", "active", "cancelled", "pastDue"] })
  status!: "free" | "trial" | "active" | "cancelled" | "pastDue";
  @ApiProperty({ nullable: true, type: String })
  trialEndsAt!: Date | null;
  @ApiProperty({ nullable: true, type: String })
  paidUntil!: Date | null;
  @ApiProperty()
  trialUsed!: boolean;
  @ApiProperty({ nullable: true, type: String })
  retryAt!: Date | null;
  @ApiProperty()
  cardLast4!: string;
  @ApiProperty()
  dogs!: number;
  @ApiProperty()
  freeDogLimit!: number;
  @ApiProperty({ description: "Non-archived dogs allowed on the current plan" })
  dogLimit!: number;
  @ApiProperty({ description: "Non-archived dogs allowed with Plus" })
  plusDogLimit!: number;
  @ApiProperty({ description: "In-progress goals" })
  goals!: number;
  @ApiProperty({
    nullable: true,
    type: Number,
    description: "In-progress goal limit; null when unlimited",
  })
  goalLimit!: number | null;
  @ApiProperty({
    description:
      "Goals in progress this request paused: Free over the goal limit pauses all of them",
  })
  pausedGoals!: number;
  @ApiProperty()
  isPlus!: boolean;
  @ApiProperty()
  needsDogChoice!: boolean;
  @ApiProperty({ nullable: true, type: String })
  activeDogId!: string | null;
  @ApiProperty({ enum: ["yearly", "monthly"] })
  billingPeriod!: "yearly" | "monthly";
}
