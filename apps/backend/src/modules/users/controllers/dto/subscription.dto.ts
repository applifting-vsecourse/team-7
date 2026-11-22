import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
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
  goals!: number;
}
