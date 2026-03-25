/** @format */

import type { Request, Response } from "express";
import { handleAsyncControl } from "../middlewares/handle-async-control.middleware.js";
import { OrderService } from "../services/order.service.js";
import { HttpStatus } from "../config/http.config.js";
import { ApiResponse } from "../util/response.util.js";

export class OrderController {
  orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  getUserOrders = handleAsyncControl(
    async (req: Request, res: Response): Promise<Response> => {
      const customerId = req.user?._id as unknown as string;
      const orders = await this.orderService.getUserOrders(customerId);

      return res.status(HttpStatus.OK).json({
        status: "ok",
        message: "Orders fetched successfully",
        data: orders,
      } as ApiResponse);
    },
  );

  getUserOrderById = handleAsyncControl(
    async (req: Request<{ orderId: string }>, res: Response): Promise<Response> => {
      const customerId = req.user?._id as unknown as string;
      const order = await this.orderService.getUserOrderById(
        customerId,
        req.params.orderId,
      );

      return res.status(HttpStatus.OK).json({
        status: "ok",
        message: "Order fetched successfully",
        data: order,
      } as ApiResponse);
    },
  );
}
