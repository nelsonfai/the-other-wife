/** @format */

import { NextFunction } from "express";
import Vendor from "../models/vendor.model";
import { BadRequestException } from "../errors/bad-request-exception.error";
import { HttpStatus } from "../config/http.config";
import { ErrorCode } from "../enums/error-code.enum";

// export const statusCheck =
//   async (status: Array<string>) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.user?._id;
//       const vendor = await Vendor.findOne({ userId });
//       if (!status.includes(vendor?.approvalStatus as string)) {
//         throw new BadRequestException(
//           "Suspended: profile cannot be deleted",
//           HttpStatus.BAD_REQUEST,
//           ErrorCode.VALIDATION_ERROR,
//         );
//       }
//       next();
//     } catch (error) {
//       next(error);
//     }
//   };
