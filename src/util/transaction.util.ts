/** @format */

import mongoose, { ClientSession } from "mongoose";

class Transaction {
  private session = {} as ClientSession;

  createTransaction = async () => {
    try {
      this.session = await mongoose.startSession();
      this.session.startTransaction();
      return this.session;
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
