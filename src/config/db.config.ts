/** @format */

import mongoose from "mongoose";

import { mongoUri } from "../constants/env.js";

export class Db {
  private connectionPromise: Promise<typeof mongoose> | null = null;

  connect = () => {
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    if (mongoose.connection.readyState === 1) {
      return Promise.resolve(mongoose);
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    try {
      this.connectionPromise = mongoose.connect(mongoUri);
      return this.connectionPromise.finally(() => {
        this.connectionPromise = null;
      });
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  };
}
