/** @format */

import mongoose, { Document, Schema, model } from "mongoose";

export interface CustomerDocument extends Document {
  userId: mongoose.Types.ObjectId;
  addressId: mongoose.Types.ObjectId;
  profileImageUrl: string;
}

const CustomerSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    index: true,
    required: true,
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: false,
  },
  profileImageUrl: {
    type: String,
    required: false,
  },
});

export default model<CustomerDocument>("Customer", CustomerSchema);
