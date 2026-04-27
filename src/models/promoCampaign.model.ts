/** @format */

import { Document, Schema, model } from "mongoose";

export interface PromoCampaignDocument extends Document {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  rewardAmount: number;
  minOrderAmount: number;
  maxAwardCount: number;
  awardedCount: number;
  currency: string;
  startsAt?: Date;
  endsAt?: Date;
}

const PromoCampaignSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    rewardAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxAwardCount: {
      type: Number,
      required: true,
      min: 1,
    },
    awardedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "NGN",
    },
    startsAt: {
      type: Date,
      required: false,
    },
    endsAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true },
);

export default model<PromoCampaignDocument>(
  "PromoCampaign",
  PromoCampaignSchema,
);
