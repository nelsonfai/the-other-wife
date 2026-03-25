/** @format */

import z from "zod";

export const checkoutPaymentProviderSchema = z.enum([
  "paystack",
  "cash",
  "wallet",
]);

export const checkoutPreviewSchema = z.object({
  addressId: z.string().trim().min(1),
});

export const checkoutConfirmSchema = z.object({
  addressId: z.string().trim().min(1),
  cartUpdatedAt: z.string().datetime(),
  paymentProvider: checkoutPaymentProviderSchema.optional().default("paystack"),
});
