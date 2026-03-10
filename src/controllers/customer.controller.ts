/** @format */

import { HttpStatus } from "../config/http.config.js";
import { handleAsyncControl } from "../middlewares/handle-async-control.middleware.js";
import { CustomerService } from "../services/customer.service.js";
import type { Request, Response } from "express";
import { ApiResponse } from "../util/response.util.js";

export class CustomerController {
  customerService: CustomerService;
  constructor() {
    this.customerService = new CustomerService();
  }

  getCustomerProfile = handleAsyncControl(
    async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
      try {
        const { id: customerId } = req.params;
        const userId = req?.user?._id as unknown as string;
        const { customer } = await this.customerService.getCustomerProfile(
          customerId,
          userId,
        );
        return res.status(HttpStatus.OK).json({
          status: "ok",
          message: "Customer profile fetched",
          data: customer,
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  updateCustomerProfile = handleAsyncControl(
    async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
      try {
        const { id: customerId } = req.params;
        const userId = req?.user?._id as unknown as string;
        const { profileImageUrl } = req.body;
        const customerProfile =
          await this.customerService.updateCustomerProfile(
            customerId,
            userId,
            profileImageUrl,
          );
        return res.status(HttpStatus.OK).json({
          status: "ok",
          message: "Customer updated",
          data: customerProfile,
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  deleteCustomerProfile = handleAsyncControl(
    async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
      try {
        const { id: customerId } = req.params;
        const userId = req?.user?._id as unknown as string;
        await this.customerService.deleteCustomerProfile(customerId, userId);
        return res.status(HttpStatus.NO_CONTENT).send();
      } catch (error) {
        throw error;
      }
    },
  );
}
