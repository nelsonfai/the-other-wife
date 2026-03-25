/** @format */

import type { Request, Response, NextFunction } from "express";
import { handleAsyncControl } from "../middlewares/handle-async-control.middleware.js";
import { AddressService } from "../services/address.service.js";
import { HttpStatus } from "../config/http.config.js";
import { ApiResponse } from "../util/response.util.js";

export class AddressController {
  addressService: AddressService;
  constructor() {
    this.addressService = new AddressService();
  }

  createUserAddress = handleAsyncControl(
    async (
      req: Request<
        {},
        {},
        {
          city: string;
          state: string;
          country: string;
          postalCode: string;
          latitude: number;
          longitude: number;
          label?: "home" | "work" | "other";
          address?: string;
          isDefault?: boolean;
        }
      >,
      res: Response,
    ): Promise<Response> => {
      const userId = req.user?._id as unknown as string;
      try {
        const userAddress = await this.addressService.createUserAddress(
          userId,
          req.body.city,
          req.body.state,
          req.body.country,
          req.body.postalCode,
          req.body.latitude,
          req.body.longitude,
          req.body.label,
          req.body.address,
          req.body.isDefault,
        );

        return res.status(HttpStatus.CREATED).json({
          status: "ok",
          message: "Address created successfully",
          data: userAddress,
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  editUserAddress = handleAsyncControl(
    async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
      const { id: addressId } = req.params;
      const userId = req.user?._id as unknown as string;
      try {
        const userAddress = await this.addressService.editUserAddress(
          userId,
          addressId,
          req.body,
        );

        return res.status(HttpStatus.OK).json({
          status: "ok",
          message: "Address updated successfully",
          data: userAddress,
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  toggleDefaultAddress = handleAsyncControl(
    async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
      const { id: addressId } = req.params;
      const userId = req.user?._id as unknown as string;
      try {
        const defaultAddress =
          await this.addressService.toggleDefaultAddress(userId, addressId);

        return res.status(HttpStatus.OK).json({
          status: "ok",
          message: "Default address set successfully",
          data: defaultAddress,
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  deleteUserAddress = handleAsyncControl(
    async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
      const { id: addressId } = req.params;
      const userId = req.user?._id as unknown as string;
      const userType = req.user?.userType as string;
      try {
        await this.addressService.deleteUserAddress(
          userId,
          addressId,
          userType,
        );
        return res.status(HttpStatus.NO_CONTENT).send();
      } catch (error) {
        throw error;
      }
    },
  );

  getUserAddresses = handleAsyncControl(
    async (req: Request<{}>, res: Response): Promise<Response> => {
      const userId = req.user?._id as unknown as string;

      try {
        const userAddresses =
          await this.addressService.getUserAddresses(userId);
        return res.status(HttpStatus.OK).json({
          status: "ok",
          message: "User addresses fetched successfully",
          data: userAddresses,
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );
}
