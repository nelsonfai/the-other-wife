/** @format */

import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Receive Paystack webhook events
 *     tags: [Payment]
 *     responses:
 *       "200":
 *         description: Webhook processed successfully
 *       "400":
 *         description: Invalid webhook payload or signature
 */

class PaymentRouter {
  paymentController: PaymentController;
  router: Router;

  constructor() {
    this.paymentController = new PaymentController();
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post("/webhook", this.paymentController.handlePaystackWebhook);
  }
}

export const paymentRouter = new PaymentRouter().router;
