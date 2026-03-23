/** @format */

import crypto from "crypto";
import { ClientSession } from "mongoose";
import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { NotFoundException } from "../errors/not-found-exception.error.js";
import { InternalServerError } from "../errors/internal-server.error.js";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import {
  paystackCallbackUrl,
  paystackSecretKey,
  paystackBaseUrl,
} from "../constants/env.js";
import { transaction } from "../util/transaction.util.js";

type InitializePaystackInput = {
  email: string;
  amount: number;
  reference: string;
  orderId: string;
  paymentId: string;
};

type PaystackInitializeResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export class PaymentService {
  initializePaystackPayment = async (
    payload: InitializePaystackInput,
  ): Promise<PaystackInitializeResponse> => {
    if (!paystackSecretKey) {
      throw new InternalServerError(
        "Paystack secret key is not configured",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }

    const response = await fetch(
      `${paystackBaseUrl}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          amount: Math.round(payload.amount * 100),
          reference: payload.reference,
          callback_url: paystackCallbackUrl || undefined,
          metadata: {
            orderId: payload.orderId,
            paymentId: payload.paymentId,
          },
        }),
      },
    );

    const data = (await response.json()) as {
      status: boolean;
      message: string;
      data?: PaystackInitializeResponse;
    };

    if (!response.ok || !data.status || !data.data) {
      throw new BadRequestException(
        data.message || "Unable to initialize payment",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    return data.data;
  };

  verifyPaystackSignature = (rawBody: string, signature?: string) => {
    if (!paystackSecretKey) {
      throw new InternalServerError(
        "Paystack secret key is not configured",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_SERVER_ERROR,
      );
    }

    if (!signature) {
      throw new BadRequestException(
        "Missing Paystack signature",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const expected = crypto
      .createHmac("sha512", paystackSecretKey)
      .update(rawBody)
      .digest("hex");

    return expected === signature;
  };

  handlePaystackWebhook = async (
    rawBody: string,
    signature: string | undefined,
    event: any,
  ) => {
    const isValidSignature = this.verifyPaystackSignature(rawBody, signature);

    if (!isValidSignature) {
      throw new BadRequestException(
        "Invalid Paystack signature",
        HttpStatus.BAD_REQUEST,
        ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
      );
    }

    if (event.event !== "charge.success") {
      return { handled: false };
    }

    const reference = event.data?.reference as string | undefined;

    if (!reference) {
      throw new BadRequestException(
        "Payment reference is required",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const payment = await Payment.findOne({ reference });

    if (!payment) {
      throw new NotFoundException(
        "Payment not found",
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }

    if (payment.status === "succeeded") {
      return { handled: true, payment };
    }

    const paidAmount = Number(event.data?.amount ?? 0) / 100;

    if (paidAmount !== payment.amount) {
      throw new BadRequestException(
        "Payment amount mismatch",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    return await transaction.use(
      async (session: ClientSession, paymentId: string, providerPayload: any) => {
        const paymentRecord = await Payment.findById(paymentId).session(session);

        if (!paymentRecord) {
          throw new NotFoundException(
            "Payment not found",
            HttpStatus.NOT_FOUND,
            ErrorCode.RESOURCE_NOT_FOUND,
          );
        }

        if (paymentRecord.status === "succeeded") {
          return { handled: true, payment: paymentRecord };
        }

        paymentRecord.status = "succeeded";
        paymentRecord.providerTransactionId = String(providerPayload.id ?? "");
        paymentRecord.providerPayload = providerPayload;
        paymentRecord.paidAt = providerPayload.paid_at
          ? new Date(providerPayload.paid_at)
          : new Date();
        await paymentRecord.save({ session });

        const order = await Order.findById(paymentRecord.orderId).session(session);

        if (!order) {
          throw new NotFoundException(
            "Order not found",
            HttpStatus.NOT_FOUND,
            ErrorCode.RESOURCE_NOT_FOUND,
          );
        }

        order.paymentStatus = "succeeded";
        order.status = "paid";
        order.paidAt = paymentRecord.paidAt;
        await order.save({ session });

        await Cart.findOneAndUpdate(
          { customerId: paymentRecord.customerId },
          {
            $set: {
              meals: [],
              totalAmount: 0,
            },
          },
          { session },
        );

        return { handled: true, payment: paymentRecord, order };
      },
    )(payment._id.toString(), event.data);
  };
}
