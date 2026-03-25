/** @format */

import type { Request, Response } from "express";
import { handleAsyncControl } from "../middlewares/handle-async-control.middleware.js";
import { UserService } from "../services/user.service.js";
import { HttpStatus } from "../config/http.config.js";
import { ApiResponse } from "../util/response.util.js";
import { nodeEnv } from "../constants/env.js";

export class UserController {
  userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getCurrentUser = handleAsyncControl(
    async (req: Request, res: Response): Promise<Response> => {
      const userId = req?.user?._id as unknown as string;
      try {
        const user = await this.userService.getCurrentUser(userId);
        return res.status(HttpStatus.OK).json({
          data: user,
          status: "ok",
          message: "User fetched successfully",
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  getAllUsers = handleAsyncControl(
    async (req: Request, res: Response): Promise<Response> => {
      try {
        const users = await this.userService.getAllUsers();
        return res.status(HttpStatus.OK).json({
          data: users,
          status: "ok",
          message: "Users fetched successfully",
        } as ApiResponse);
      } catch (error) {
        throw error;
      }
    },
  );

  closeCurrentUserAccount = handleAsyncControl(
    async (
      req: Request<{}, {}, { password: string }>,
      res: Response,
    ): Promise<Response> => {
      const userId = req.user?._id as unknown as string;
      const { password } = req.body;

      await this.userService.closeCurrentUserAccount(userId, password);

      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: nodeEnv === "production",
        path: "/",
        expires: new Date(0),
      });
      res.clearCookie("refreshToken");

      return res.status(HttpStatus.NO_CONTENT).send();
    },
  );

  updateUserStatus = handleAsyncControl(
    async (
      req: Request<{ userId: string }, {}, { status: "active" | "suspended" | "deleted" }>,
      res: Response,
    ): Promise<Response> => {
      const { userId } = req.params;
      const { status } = req.body;

      const user = await this.userService.updateUserStatus(userId, status);

      return res.status(HttpStatus.OK).json({
        data: user,
        status: "ok",
        message: "User status updated successfully",
      } as ApiResponse);
    },
  );
}
