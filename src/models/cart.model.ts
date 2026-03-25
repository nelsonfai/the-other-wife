/** @format */

import mongoose, { Document, Schema, model } from "mongoose";

export interface CartDocument extends Document {
  customerId: mongoose.Types.ObjectId;
  meals: {
    mealId: mongoose.Types.ObjectId;
    price: number;
    quantity: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CartSchema = new Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    meals: [
      {
        mealId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Meal",
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true },
);

export default model<CartDocument>("Cart", CartSchema);
