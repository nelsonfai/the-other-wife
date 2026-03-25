/** @format */

import assert from "node:assert/strict";
import test from "node:test";
import { CheckoutController } from "../src/controllers/checkout.controller.js";
import { PaymentController } from "../src/controllers/payment.controller.js";
import { OrderController } from "../src/controllers/order.controller.js";
import { zodValidation } from "../src/middlewares/validation.js";
import {
  checkoutConfirmSchema,
  checkoutPreviewSchema,
} from "../src/zod-schema/checkout.schema.js";

const withPatchedMethod = async <T extends object, K extends keyof T>(
  obj: T,
  key: K,
  replacement: T[K],
  callback: () => Promise<void> | void,
) => {
  const original = obj[key];
  obj[key] = replacement;
  try {
    await callback();
  } finally {
    obj[key] = original;
  }
};

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response;
};

const runHandlers = async (
  handlers: Array<(req: any, res: any, next: (error?: unknown) => void) => unknown>,
  req: any,
) => {
  const res = createResponse();

  for (const handler of handlers) {
    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const next = (error?: unknown) => {
        settled = true;
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };

      Promise.resolve(handler(req, res as any, next))
        .then(() => {
          if (!settled) {
            resolve();
          }
        })
        .catch(reject);
    });
  }

  return res;
};

const authReq = (overrides: Record<string, unknown> = {}) => ({
  user: { _id: "user-1", userType: "customer" },
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides,
});

test("POST /checkout/preview returns preview payload", async () => {
  const controller = new CheckoutController();

  await withPatchedMethod(
    controller.checkoutService,
    "previewCheckout",
    (async (customerId: string, addressId: string) => ({
      customerId,
      addressId,
      items: [],
    })) as typeof controller.checkoutService.previewCheckout,
    async () => {
      const res = await runHandlers(
        [zodValidation(checkoutPreviewSchema), controller.previewCheckout as any],
        authReq({ body: { addressId: "address-1" } }),
      );

      assert.equal(res.statusCode, 200);
      assert.equal((res.body as any).status, "ok");
      assert.equal((res.body as any).data.customerId, "user-1");
      assert.equal((res.body as any).data.addressId, "address-1");
    },
  );
});

test("POST /checkout/preview validates request body", async () => {
  const controller = new CheckoutController();

  await assert.rejects(
    async () =>
      await runHandlers(
        [zodValidation(checkoutPreviewSchema), controller.previewCheckout as any],
        authReq({ body: {} }),
      ),
  );
});

test("POST /checkout/confirm returns initialized checkout payload", async () => {
  const controller = new CheckoutController();

  await withPatchedMethod(
    controller.checkoutService,
    "confirmCheckout",
    (async (
      customerId: string,
      addressId: string,
      cartUpdatedAt: string,
      paymentProvider?: "paystack" | "cash" | "wallet",
    ) => ({
      customerId,
      addressId,
      cartUpdatedAt,
      paymentProvider,
      order: { id: "order-1" },
      payment: { id: "payment-1" },
    })) as typeof controller.checkoutService.confirmCheckout,
    async () => {
      const res = await runHandlers(
        [zodValidation(checkoutConfirmSchema), controller.confirmCheckout as any],
        authReq({
          body: {
            addressId: "address-1",
            cartUpdatedAt: "2026-03-17T12:00:00.000Z",
            paymentProvider: "cash",
          },
        }),
      );

      assert.equal(res.statusCode, 201);
      assert.equal((res.body as any).data.order.id, "order-1");
      assert.equal((res.body as any).data.customerId, "user-1");
      assert.equal((res.body as any).data.paymentProvider, "cash");
    },
  );
});

test("POST /checkout/confirm defaults payment provider to paystack", async () => {
  const controller = new CheckoutController();

  await withPatchedMethod(
    controller.checkoutService,
    "confirmCheckout",
    (async (
      customerId: string,
      addressId: string,
      cartUpdatedAt: string,
      paymentProvider?: "paystack" | "cash" | "wallet",
    ) => ({
      customerId,
      addressId,
      cartUpdatedAt,
      paymentProvider,
    })) as typeof controller.checkoutService.confirmCheckout,
    async () => {
      const res = await runHandlers(
        [zodValidation(checkoutConfirmSchema), controller.confirmCheckout as any],
        authReq({
          body: {
            addressId: "address-1",
            cartUpdatedAt: "2026-03-17T12:00:00.000Z",
          },
        }),
      );

      assert.equal((res.body as any).data.paymentProvider, "paystack");
    },
  );
});

test("POST /payments/webhook forwards raw body and signature", async () => {
  const controller = new PaymentController();
  let capturedArgs:
    | {
        rawBody: string;
        signature?: string;
        event: any;
      }
    | undefined;

  await withPatchedMethod(
    controller.paymentService,
    "handlePaystackWebhook",
    (async (rawBody: string, signature: string | undefined, event: any) => {
      capturedArgs = { rawBody, signature, event };
      return { handled: true };
    }) as typeof controller.paymentService.handlePaystackWebhook,
    async () => {
      const payload = { event: "charge.success", data: { reference: "ref-1" } };
      const res = await runHandlers(
        [controller.handlePaystackWebhook as any],
        authReq({
          body: payload,
          rawBody: JSON.stringify(payload),
          headers: { "x-paystack-signature": "sig-123" },
        }),
      );

      assert.equal(res.statusCode, 200);
      assert.equal((res.body as any).message, "Webhook processed successfully");
      assert.equal(capturedArgs?.signature, "sig-123");
      assert.equal(capturedArgs?.rawBody, JSON.stringify(payload));
      assert.deepEqual(capturedArgs?.event, payload);
    },
  );
});

test("GET /orders/me returns current user orders", async () => {
  const controller = new OrderController();

  await withPatchedMethod(
    controller.orderService,
    "getUserOrders",
    (async (customerId: string) => ({
      orders: [{ id: "order-1" }],
      customerId,
    })) as typeof controller.orderService.getUserOrders,
    async () => {
      const res = await runHandlers(
        [controller.getUserOrders as any],
        authReq(),
      );

      assert.equal(res.statusCode, 200);
      assert.equal((res.body as any).data.customerId, "user-1");
      assert.equal((res.body as any).data.orders[0].id, "order-1");
    },
  );
});

test("GET /orders/:orderId returns a specific order for the current user", async () => {
  const controller = new OrderController();

  await withPatchedMethod(
    controller.orderService,
    "getUserOrderById",
    (async (customerId: string, orderId: string) => ({
      order: { id: orderId },
      customerId,
    })) as typeof controller.orderService.getUserOrderById,
    async () => {
      const res = await runHandlers(
        [controller.getUserOrderById as any],
        authReq({ params: { orderId: "order-77" } }),
      );

      assert.equal(res.statusCode, 200);
      assert.equal((res.body as any).data.customerId, "user-1");
      assert.equal((res.body as any).data.order.id, "order-77");
    },
  );
});
