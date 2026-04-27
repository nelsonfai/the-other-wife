/** @format */

import { Router } from "express";
import { CheckoutController } from "../controllers/checkout.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleGuardMiddleware } from "../middlewares/role-guard.middleware.js";
import { zodValidation } from "../middlewares/validation.js";
import {
  checkoutConfirmSchema,
  checkoutPreviewSchema,
} from "../zod-schema/checkout.schema.js";

/**
 * @swagger
 * /api/v1/checkout/preview:
 *   post:
 *     summary: Generate a checkout preview for the active cart
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressId]
 *             properties:
 *               addressId:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Checkout preview generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not found
 */

/**
 * @swagger
 * /api/v1/checkout/confirm:
 *   post:
 *     summary: Create a pending order and initialize payment
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CheckoutConfirmRequest"
 *           examples:
 *             paystack:
 *               summary: Confirm checkout with Paystack
 *               value:
 *                 addressId: "67ff2f8be1234567890abcde"
 *                 cartUpdatedAt: "2026-03-17T12:00:00.000Z"
 *                 useWallet: false
 *                 paymentProvider: "paystack"
 *             cash:
 *               summary: Confirm checkout with cash payment
 *               value:
 *                 addressId: "67ff2f8be1234567890abcde"
 *                 cartUpdatedAt: "2026-03-17T12:00:00.000Z"
 *                 useWallet: false
 *                 paymentProvider: "cash"
 *             split:
 *               summary: Confirm checkout with wallet + Paystack split
 *               value:
 *                 addressId: "67ff2f8be1234567890abcde"
 *                 cartUpdatedAt: "2026-03-17T12:00:00.000Z"
 *                 useWallet: true
 *                 paymentProvider: "paystack"
 *     responses:
 *       "201":
 *         description: Checkout confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: "#/components/schemas/CheckoutConfirmResponse"
 *       "400":
 *         description: Validation error
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not found
 */

class CheckoutRouter {
  checkoutController: CheckoutController;
  router: Router;

  constructor() {
    this.checkoutController = new CheckoutController();
    this.router = Router();
    this.router.use(authMiddleware);
    this.router.use(roleGuardMiddleware(["customer"]));
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post(
      "/preview",
      zodValidation(checkoutPreviewSchema),
      this.checkoutController.previewCheckout,
    );
    this.router.post(
      "/confirm",
      zodValidation(checkoutConfirmSchema),
      this.checkoutController.confirmCheckout,
    );
  }
}

export const checkoutRouter = new CheckoutRouter().router;
