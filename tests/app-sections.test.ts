/** @format */

import assert from "node:assert/strict";
import test from "node:test";
import { AddressService } from "../src/services/address.service.js";
import { UserService } from "../src/services/user.service.js";
import { CheckoutService } from "../src/services/checkout.service.js";
import { PaymentService } from "../src/services/payment.service.js";
import { MealController } from "../src/controllers/meal.controller.js";
import { transaction } from "../src/util/transaction.util.js";
import Address from "../src/models/address.model.js";
import Vendor from "../src/models/vendor.model.js";
import User from "../src/models/user.model.js";
import Cart from "../src/models/cart.model.js";
import Meal from "../src/models/meal.model.js";
import Payment from "../src/models/payment.model.js";
import Order from "../src/models/order.model.js";

const objectId = (value: string) => ({
  toString: () => value,
});

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

test("AddressService.toggleDefaultAddress unsets a default address when toggled", async () => {
  await withPatchedMethod(
    transaction,
    "use",
    (((callback: any) =>
      async (...args: any[]) =>
        callback({} as any, ...args)) as typeof transaction.use),
    async () => {
      const address = {
        _id: objectId("address-1"),
        userId: objectId("user-1"),
        isDefault: true,
        save: async () => address,
      };

      await withPatchedMethod(
        Address,
        "findOne",
        ((() => ({
          session: async () => address,
        })) as unknown as typeof Address.findOne),
        async () => {
          let updateCalled = false;

          await withPatchedMethod(
            Address,
            "updateMany",
            ((() => ({
              session: async () => {
                updateCalled = true;
              },
            })) as unknown as typeof Address.updateMany),
            async () => {
              const service = new AddressService();
              const result = await service.toggleDefaultAddress(
                "user-1",
                "address-1",
              );

              assert.equal(result.userAddress.isDefault, false);
              assert.equal(updateCalled, false);
            },
          );
        },
      );
    },
  );
});

test("UserService.updateUserStatus re-approves suspended vendors on reactivation", async () => {
  await withPatchedMethod(
    transaction,
    "use",
    (((callback: any) =>
      async (...args: any[]) =>
        callback({} as any, ...args)) as typeof transaction.use),
    async () => {
      const user = {
        _id: objectId("user-1"),
        userType: "vendor",
        status: "suspended",
        refreshToken: "x",
        emailToken: "y",
        otp: "z",
        refreshTokenExpiry: new Date(),
        emailTokenExpiry: new Date(),
        otpExpiry: new Date(),
        save: async () => user,
        omitPassword: () => ({ _id: "user-1", userType: "vendor", status: user.status }),
      };

      const vendor = {
        approvalStatus: "suspended",
      };

      await withPatchedMethod(
        User,
        "findById",
        ((() => ({
          session: async () => user,
        })) as unknown as typeof User.findById),
        async () => {
          await withPatchedMethod(
            Vendor,
            "findOne",
            ((() => ({
              session: async () => vendor,
            })) as unknown as typeof Vendor.findOne),
            async () => {
              let updatedApprovalStatus: string | undefined;

              await withPatchedMethod(
                Vendor,
                "findOneAndUpdate",
                (((_filter: any, update: any) => {
                  updatedApprovalStatus = update.$set.approvalStatus;
                  return Promise.resolve({ approvalStatus: updatedApprovalStatus });
                }) as unknown as typeof Vendor.findOneAndUpdate),
                async () => {
                  const service = new UserService();
                  await service.updateUserStatus("user-1", "active");

                  assert.equal(user.status, "active");
                  assert.equal(updatedApprovalStatus, "approved");
                },
              );
            },
          );
        },
      );
    },
  );
});

test("MealController.getMeals passes undefined pagination for invalid values", async () => {
  const controller = new MealController();
  let capturedPagination: { pageSize?: number; pageNumber?: number } | undefined;

  (controller as any).mealService.getMeals = async (
    _query: unknown,
    pagination: { pageSize?: number; pageNumber?: number },
  ) => {
    capturedPagination = pagination;
    return { meals: [], pagination: {} };
  };

  const req = {
    query: {
      pageSize: "not-a-number",
      pageNumber: "",
    },
  } as any;

  const res = {
    status: (_status: number) => ({
      json: (payload: unknown) => payload,
    }),
  } as any;

  await controller.getMeals(req, res, (error?: unknown) => {
    if (error) throw error;
  });

  assert.deepEqual(capturedPagination, {
    pageSize: undefined,
    pageNumber: undefined,
  });
});

test("CheckoutService.previewCheckout computes pricing from live cart and meal data", async () => {
  const service = new CheckoutService();

  const cart = {
    _id: objectId("cart-1"),
    updatedAt: new Date("2026-03-17T10:00:00.000Z"),
    meals: [
      {
        mealId: objectId("meal-1"),
        quantity: 2,
      },
    ],
  };

  const address = {
    _id: objectId("address-1"),
    label: "home",
    address: "12 Test Street",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    postalCode: "100001",
    latitude: 6.4,
    longitude: 3.4,
  };

  const meal = {
    _id: objectId("meal-1"),
    name: "Jollof Rice",
    price: 4500,
    vendorId: objectId("vendor-1"),
  };

  const vendor = {
    _id: objectId("vendor-1"),
    businessName: "The Other Wife Kitchen",
    approvalStatus: "approved",
  };

  await withPatchedMethod(
    Cart,
    "findOne",
    ((() => Promise.resolve(cart)) as unknown as typeof Cart.findOne),
    async () => {
      await withPatchedMethod(
        Address,
        "findOne",
        ((() => Promise.resolve(address)) as unknown as typeof Address.findOne),
        async () => {
          await withPatchedMethod(
            Meal,
            "find",
            ((() => Promise.resolve([meal])) as unknown as typeof Meal.find),
            async () => {
              await withPatchedMethod(
                Vendor,
                "findById",
                ((() => Promise.resolve(vendor)) as unknown as typeof Vendor.findById),
                async () => {
                  const preview = await service.previewCheckout(
                    "user-1",
                    "address-1",
                  );

                  assert.equal(preview.pricing.subtotal, 9000);
                  assert.equal(preview.pricing.totalAmount, 9000);
                  assert.equal(preview.vendor.id, "vendor-1");
                  assert.equal(preview.cartUpdatedAt, "2026-03-17T10:00:00.000Z");
                },
              );
            },
          );
        },
      );
    },
  );
});

test("CheckoutService.confirmCheckout rejects wallet payments for now", async () => {
  const service = new CheckoutService();

  await assert.rejects(
    async () =>
      await service.confirmCheckout(
        "user-1",
        "address-1",
        "2026-03-17T10:00:00.000Z",
        "wallet",
      ),
    /Wallet payment is not implemented yet/,
  );
});

test("CheckoutService.confirmCheckout creates a cash order without Paystack initialization", async () => {
  const service = new CheckoutService();

  const user = {
    email: "customer@example.com",
  };

  const cart = {
    _id: objectId("cart-1"),
    updatedAt: new Date("2026-03-17T10:00:00.000Z"),
    meals: [
      {
        mealId: objectId("meal-1"),
        quantity: 2,
      },
    ],
  };

  const address = {
    _id: objectId("address-1"),
    label: "home",
    address: "12 Test Street",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    postalCode: "100001",
    latitude: 6.4,
    longitude: 3.4,
  };

  const meal = {
    _id: objectId("meal-1"),
    name: "Jollof Rice",
    price: 4500,
    vendorId: objectId("vendor-1"),
  };

  const vendor = {
    _id: objectId("vendor-1"),
    businessName: "The Other Wife",
    approvalStatus: "approved",
  };

  const orderRecord = {
    _id: objectId("order-1"),
    status: "pending_payment",
    paymentStatus: "pending",
  };

  const paymentRecord = {
    _id: objectId("payment-1"),
    provider: "cash",
    status: "pending",
    authorizationUrl: undefined,
  };

  await withPatchedMethod(
    User,
    "findById",
    ((() => ({
      select: async () => user,
    })) as unknown as typeof User.findById),
    async () => {
      await withPatchedMethod(
        transaction,
        "use",
        (((callback: any) =>
          async (...args: any[]) =>
            callback(undefined, ...args)) as typeof transaction.use),
        async () => {
          await withPatchedMethod(
            Cart,
            "findOne",
            ((() => Promise.resolve(cart)) as unknown as typeof Cart.findOne),
            async () => {
              await withPatchedMethod(
                Address,
                "findOne",
                ((() => Promise.resolve(address)) as unknown as typeof Address.findOne),
                async () => {
                  await withPatchedMethod(
                    Meal,
                    "find",
                    ((() => Promise.resolve([meal])) as unknown as typeof Meal.find),
                    async () => {
                      await withPatchedMethod(
                        Vendor,
                        "findById",
                        ((() => Promise.resolve(vendor)) as unknown as typeof Vendor.findById),
                        async () => {
                          await withPatchedMethod(
                            Order,
                            "create",
                            (((records: any[]) =>
                              Promise.resolve([
                                {
                                  ...orderRecord,
                                  ...records[0],
                                },
                              ])) as unknown as typeof Order.create),
                            async () => {
                              await withPatchedMethod(
                                Payment,
                                "create",
                                (((records: any[]) =>
                                  Promise.resolve([
                                    {
                                      ...paymentRecord,
                                      ...records[0],
                                    },
                                  ])) as unknown as typeof Payment.create),
                                async () => {
                                  let paystackCalled = false;

                                  service["paymentService"].initializePaystackPayment =
                                    async () => {
                                      paystackCalled = true;
                                      throw new Error("should not be called");
                                    };

                                  await withPatchedMethod(
                                    Order,
                                    "findByIdAndUpdate",
                                    (((_id: any, update: any) =>
                                      Promise.resolve({
                                        ...orderRecord,
                                        status: update.$set.status,
                                        paymentStatus: update.$set.paymentStatus,
                                      })) as unknown as typeof Order.findByIdAndUpdate),
                                    async () => {
                                      await withPatchedMethod(
                                        Payment,
                                        "findByIdAndUpdate",
                                        (((_id: any, update: any) =>
                                          Promise.resolve({
                                            ...paymentRecord,
                                            status: update.$set.status,
                                          })) as unknown as typeof Payment.findByIdAndUpdate),
                                        async () => {
                                          const result =
                                            await service.confirmCheckout(
                                              "user-1",
                                              "address-1",
                                              "2026-03-17T10:00:00.000Z",
                                              "cash",
                                            );

                                          assert.equal(paystackCalled, false);
                                          assert.equal(result.order.status, "confirmed");
                                          assert.equal(
                                            result.payment.provider,
                                            "cash",
                                          );
                                          assert.equal(result.payment.status, "pending");
                                          assert.equal(
                                            result.payment.authorizationUrl,
                                            undefined,
                                          );
                                        },
                                      );
                                    },
                                  );
                                },
                              );
                            },
                          );
                        },
                      );
                    },
                  );
                },
              );
            },
          );
        },
      );
    },
  );
});

test("PaymentService.handlePaystackWebhook marks payment succeeded, pays order, and clears cart", async () => {
  const service = new PaymentService();
  service.verifyPaystackSignature = () => true;

  const paymentLookup = {
    _id: objectId("payment-1"),
    amount: 9000,
  };

  const paymentRecord = {
    _id: objectId("payment-1"),
    orderId: objectId("order-1"),
    customerId: objectId("user-1"),
    status: "pending_customer_action",
    providerTransactionId: "",
    providerPayload: undefined,
    paidAt: undefined as Date | undefined,
    save: async () => paymentRecord,
  };

  const orderRecord = {
    _id: objectId("order-1"),
    paymentStatus: "pending",
    status: "pending_payment",
    paidAt: undefined as Date | undefined,
    save: async () => orderRecord,
  };

  await withPatchedMethod(
    Payment,
    "findOne",
    ((() => Promise.resolve(paymentLookup)) as unknown as typeof Payment.findOne),
    async () => {
      await withPatchedMethod(
        transaction,
        "use",
        (((callback: any) =>
          async (...args: any[]) =>
            callback({} as any, ...args)) as typeof transaction.use),
        async () => {
          await withPatchedMethod(
            Payment,
            "findById",
            ((() => ({
              session: async () => paymentRecord,
            })) as unknown as typeof Payment.findById),
            async () => {
              await withPatchedMethod(
                Order,
                "findById",
                ((() => ({
                  session: async () => orderRecord,
                })) as unknown as typeof Order.findById),
                async () => {
                  let cartCleared = false;

                  await withPatchedMethod(
                    Cart,
                    "findOneAndUpdate",
                    (((_filter: any, update: any) => {
                      cartCleared =
                        Array.isArray(update.$set.meals) &&
                        update.$set.meals.length === 0 &&
                        update.$set.totalAmount === 0;
                      return Promise.resolve({});
                    }) as unknown as typeof Cart.findOneAndUpdate),
                    async () => {
                      const result = await service.handlePaystackWebhook(
                        "{}",
                        "sig",
                        {
                          event: "charge.success",
                          data: {
                            id: 123,
                            reference: "ref-1",
                            amount: 900000,
                            paid_at: "2026-03-17T12:00:00.000Z",
                          },
                        },
                      );

                      assert.equal(result.handled, true);
                      assert.equal(paymentRecord.status, "succeeded");
                      assert.equal(orderRecord.status, "paid");
                      assert.equal(orderRecord.paymentStatus, "succeeded");
                      assert.equal(cartCleared, true);
                    },
                  );
                },
              );
            },
          );
        },
      );
    },
  );
});
