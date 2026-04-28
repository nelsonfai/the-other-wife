/** @format */

import { SignalDispatcher } from "./signal.dispatcher.js";

export type AppSignals = {
  "order.created": {
    orderId: string;
    customerUserId: string;
    vendorId: string;
    totalAmount: number;
    currency: string;
  };
  "order.status_changed": {
    orderId: string;
    customerUserId: string;
    vendorId: string;
    previousStatus: string;
    currentStatus: string;
  };
  "vendor.approved": {
    vendorId: string;
    vendorUserId: string;
    approvedByUserId: string;
  };
};

export const appSignalDispatcher = new SignalDispatcher<AppSignals>();
