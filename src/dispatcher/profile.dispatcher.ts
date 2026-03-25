/** @format */

import type { ClientSession } from "mongoose";

import Customer from "../models/customer.model.js";
import Vendor from "../models/vendor.model.js";

import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";

export const CreateProfile = {
  customer: (userId: string, session: ClientSession) =>
    Customer.create([{ userId }], { session }),
  vendor: (userId: string, session: ClientSession) =>
    Vendor.create([{ userId }], { session }),
  admin: () => {
    throw new BadRequestException(
      "Admin user cannot be created via public signup.",
      HttpStatus.BAD_REQUEST,
      ErrorCode.ACCESS_UNAUTHORIZED,
    );
  },
};
