/** @format */

import mongoose, { ClientSession } from "mongoose";

class Transaction {
  createTransaction = async () => {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();
      return session;
    } catch (error) {
      throw error;
    }
  };

  use =
    <Args extends any[], R>(
      callback: (session: ClientSession, ...args: Args) => Promise<R>,
    ) =>
    async (...args: Args) => {
      const session = await this.createTransaction();
      try {
        const result: R = await callback(session, ...args);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    };
}

export const transaction = new Transaction();
