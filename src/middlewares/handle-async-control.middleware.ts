/** @format */

import type { NextFunction, Request, Response } from "express";

export type HandleAsyncControl<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response,
) => Promise<Response>;

export const handleAsyncControl =
  <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
    controller: HandleAsyncControl<P, ResBody, ReqBody, ReqQuery>,
  ) =>
  async (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      return await controller(req, res);
    } catch (error) {
      next(error);
    }
  };
