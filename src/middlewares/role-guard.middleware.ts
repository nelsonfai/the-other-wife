/** @format */

import type { NextFunction, Request, Response } from "express";
import { UnauthorizedExceptionError } from "../errors/unauthorized-exception.error.js";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";

export const roleGuardMiddleware = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!roles.includes(req.user?.userType as string)) {
        console.log("User Type: ", req.user?.userType);
        throw new UnauthorizedExceptionError(
          `Forbidden. ${req.user?.userType} is not allowed to access this resource`,
          HttpStatus.FORBIDDEN,
          ErrorCode.ACCESS_UNAUTHORIZED,
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
