/** @format */

import type { Request, Response } from "express";
import { handleAsyncControl } from "../middlewares/handle-async-control.middleware.js";
import { PaymentService } from "../services/payment.service.js";
import { HttpStatus } from "../config/http.config.js";

export class PaymentController {
  paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  handlePaystackWebhook = handleAsyncControl(
    async (req: Request, res: Response): Promise<Response> => {
      const signature = req.headers["x-paystack-signature"] as string | undefined;
      const result = await this.paymentService.handlePaystackWebhook(
        req.rawBody ?? "",
        signature,
        req.body,
      );

      return res.status(HttpStatus.OK).json({
        status: "ok",
        message: result.handled
          ? "Webhook processed successfully"
          : "Webhook event ignored",
      });
    },
  );
}
