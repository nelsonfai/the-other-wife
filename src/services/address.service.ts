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
      addressId: string,
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
      const userAddress = await Address.findById(addressId).session(session);

      if (!userAddress) {
        throw new NotFoundException(
          "Address not found",
          HttpStatus.NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }

      if (typeof isDefault === "boolean" && isDefault) {
        await Address.updateMany(
          { userId: userAddress.userId },
          { $set: { isDefault: false } },
        ).session(session);
      }

      const updatedAddress = await Address.findByIdAndUpdate(
        addressId,
        {
          $set: {
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
        },
        {
          new: true,
        },
      ).session(session);

      return { updatedAddress };
    },
  );

  toggleDefaultAddress = async (addressId: string) => {
    const userAddress = await Address.findById(addressId);

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
      );
    }

    userAddress.isDefault = nextIsDefault;

    await userAddress.save();

    return { userAddress };
  };

  deleteUserAddress = async (addressId: string) =>
    (await Address.findByIdAndDelete(addressId)) ??
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

    const userAddresses = await Address.find({ userId }).populate(
      "userId",
      "firstName lastName",
    );
    if (!userAddresses) {
      throw new NotFoundException(
        "Address not found",
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    }
    return { userAddresses };
  };
}
