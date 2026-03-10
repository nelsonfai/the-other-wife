/** @format */

import z from "zod";
import type { NextFunction, Request, Response } from "express";
import User from "../models/user.model.js";

export const zodValidation =
  (schema: z.ZodType<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = schema.parse(req.body);
      Object.assign(req.body, value);
      next();
    } catch (error) {
      throw error;
    }
  };
