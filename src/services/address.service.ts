/** @format */

import Address from "../models/address.model.js";
import { NotFoundException } from "../errors/not-found-exception.error.js";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import Customer from "../models/customer.model.js";
import Vendor from "../models/vendor.model.js";
import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { transaction } from "../util/transaction.util.js";
import { ClientSession } from "mongoose";

export class AddressService {
  constructor() {}

  createUserAddress = transaction.use(
    async (
      session: ClientSession,
      userId: string,
      city: string,
      state: string,
      country: string,
      postalCode: string,
      latitude: number,
      longitude: number,
      label?: "home" | "work" | "other",
      address?: string,
      isDefault?: boolean,
    ) => {
      if (!userId) {
        throw new BadRequestException(
          "User not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
        );
      }

      if (isDefault) {
        await Address.updateMany(
          { userId },
          { $set: { isDefault: false } },
          { session },
        );
      }

      const [userAddress] = await Address.create(
        [
          {
            userId,
            city,
            state,
            country,
            postalCode,
            latitude,
            longitude,
            label,
            address,
            isDefault,
          },
        ],
        { session },
      );

      if (!userAddress) {
        throw new NotFoundException(
          "Address not found",
          HttpStatus.NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }

      await Promise.all([
        Customer.findOneAndUpdate(
          { userId },
          { $set: { addressId: userAddress._id } },
          { new: true },
        ).session(session),
        Vendor.findOneAndUpdate(
          { userId },
          { $set: { addressId: userAddress._id } },
          { new: true },
        ).session(session),
      ]);

      return { userAddress };
    },
  );

  editUserAddress = transaction.use(
    async (
      session: ClientSession,
      userId: string,
      addressId: string,
      data: {
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
        latitude?: number;
        longitude?: number;
        label?: "home" | "work" | "other";
        address?: string;
        isDefault?: boolean;
      },
    ) => {
      const userAddress = await Address.findOne({
        _id: addressId,
        userId,
      }).session(session);

      if (!userAddress) {
        throw new NotFoundException(
          "Address not found",
          HttpStatus.NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }

      if (typeof data.isDefault === "boolean" && data.isDefault) {
        await Address.updateMany(
          { userId: userAddress.userId },
          { $set: { isDefault: false } },
        ).session(session);
      }

      const updatedAddress = await Address.findOneAndUpdate(
        { _id: addressId, userId },
        {
          $set: {
            ...(data.city !== undefined && { city: data.city }),
            ...(data.state !== undefined && { state: data.state }),
            ...(data.country !== undefined && { country: data.country }),
            ...(data.postalCode !== undefined && {
              postalCode: data.postalCode,
            }),
            ...(data.latitude !== undefined && { latitude: data.latitude }),
            ...(data.longitude !== undefined && { longitude: data.longitude }),
            ...(data.label !== undefined && { label: data.label }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          },
        },
        {
          new: true,
        },
      ).session(session);

      return { updatedAddress };
    },
  );

  toggleDefaultAddress = transaction.use(
    async (session: ClientSession, userId: string, addressId: string) => {
      const userAddress = await Address.findOne({
        _id: addressId,
        userId,
      }).session(session);

      if (!userAddress) {
        throw new NotFoundException(
          "Address not found",
          HttpStatus.NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }

      const nextIsDefault = !userAddress.isDefault;

      if (nextIsDefault) {
        await Address.updateMany(
          { userId: userAddress.userId },
          { $set: { isDefault: false } },
        ).session(session);
      }

      userAddress.isDefault = nextIsDefault;

      await userAddress.save({ session });

      return { userAddress };
    },
  );

  deleteUserAddress = async (
    requesterId: string,
    addressId: string,
    requesterType: string,
  ) =>
    (await Address.findOneAndDelete({
      _id: addressId,
      ...(requesterType === "admin" ? {} : { userId: requesterId }),
    })) ??
    (() => {
      throw new NotFoundException(
        "Address not found",
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    })();

  getUserAddresses = async (userId: string) => {
    if (!userId) {
      throw new BadRequestException(
        "User not found",
        HttpStatus.BAD_REQUEST,
        ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
      );
    }

    const userAddresses = await Address.find({ userId })
      .populate("userId", "firstName lastName")
      .sort({ isDefault: -1, createdAt: -1 });

    return { userAddresses };
  };
}
