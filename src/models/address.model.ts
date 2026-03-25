/** @format */

import mongoose, { Document, Schema, model } from "mongoose";

export interface AddressDocument extends Document {
  userId: mongoose.Types.ObjectId;
  label: "home" | "work" | "other";
  address?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

const AddressSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  label: {
    type: String,
    required: true,
    enum: ["home", "work", "other"],
    default: "home",
  },
  address: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  isDefault: {
    type: Boolean,
    required: false,
    default: false,
  },
});

export default model<AddressDocument>("Address", AddressSchema);
