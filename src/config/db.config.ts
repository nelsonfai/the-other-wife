/** @format */

import mongoose from "mongoose";

import { mongoUri } from "../constants/env.js";

export class Db {
  connect = () => {
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    try {
      return mongoose.connect(mongoUri);
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  };
}
