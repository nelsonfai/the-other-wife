/** @format */

import { appSignalDispatcher } from "../dispatcher/app-signal.dispatcher.js";
import Customer from "../models/customer.model.js";
import Vendor from "../models/vendor.model.js";
import { PushNotificationService } from "../services/push-notification.service.js";

const pushNotificationService = new PushNotificationService();

appSignalDispatcher.on("order.created", async (payload) => {
  const vendor = await Vendor.findById(payload.vendorId).select(
    "expoTokens pushNotificationsEnabled",
  );

  if (!vendor || vendor.pushNotificationsEnabled === false) return;

  await pushNotificationService.sendToTokens(vendor.expoTokens ?? [], {
    title: "New order received",
    body: `Order #${payload.orderId.slice(-6)} for ${payload.currency} ${payload.totalAmount} is waiting for your action.`,
    data: {
      type: "order_created",
      orderId: payload.orderId,
    },
  });
});

appSignalDispatcher.on("order.status_changed", async (payload) => {
  const [customer, vendor] = await Promise.all([
    Customer.findOne({ userId: payload.customerUserId }).select(
      "expoTokens pushNotificationsEnabled",
    ),
    Vendor.findById(payload.vendorId).select("expoTokens pushNotificationsEnabled"),
  ]);

  if (customer && customer.pushNotificationsEnabled !== false) {
    await pushNotificationService.sendToTokens(customer.expoTokens ?? [], {
      title: "Order update",
      body: `Order #${payload.orderId.slice(-6)} changed from ${payload.previousStatus} to ${payload.currentStatus}.`,
      data: {
        type: "order_status_changed",
        orderId: payload.orderId,
        previousStatus: payload.previousStatus,
        currentStatus: payload.currentStatus,
      },
    });
  }

  if (vendor && vendor.pushNotificationsEnabled !== false) {
    await pushNotificationService.sendToTokens(vendor.expoTokens ?? [], {
      title: "Order status updated",
      body: `Order #${payload.orderId.slice(-6)} is now ${payload.currentStatus}.`,
      data: {
        type: "order_status_changed",
        orderId: payload.orderId,
        currentStatus: payload.currentStatus,
      },
    });
  }
});

appSignalDispatcher.on("vendor.approved", async (payload) => {
  const vendor = await Vendor.findById(payload.vendorId).select(
    "expoTokens pushNotificationsEnabled",
  );

  if (!vendor || vendor.pushNotificationsEnabled === false) return;

  await pushNotificationService.sendToTokens(vendor.expoTokens ?? [], {
    title: "Vendor account approved",
    body: "Your vendor profile has been approved by admin. You can now receive orders.",
    data: {
      type: "vendor_approved",
      vendorId: payload.vendorId,
    },
  });
});
