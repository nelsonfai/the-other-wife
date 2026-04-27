/** @format */

import mongoose, { Document, Schema, model } from "mongoose";

export interface WalletDocument extends Document {
  userId: mongoose.Types.ObjectId;
  walletType: "promo";
  currency: string;
  availableBalance: number;
  withdrawable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    walletType: {
      type: String,
      enum: ["promo"],
      default: "promo",
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "NGN",
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    withdrawable: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true },
);

export default model<WalletDocument>("Wallet", WalletSchema);
