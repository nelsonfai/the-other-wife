/** @format */

import type { Request, Response } from "express";
import { HttpStatus } from "../config/http.config.js";
import { handleAsyncControl } from "../middlewares/handle-async-control.middleware.js";
import { WalletService } from "../services/wallet.service.js";
import { ApiResponse } from "../util/response.util.js";

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  getWalletBalance = handleAsyncControl(
    async (req: Request, res: Response): Promise<Response> => {
      const userId = req.user?._id as unknown as string;
      const data = await this.walletService.getWalletBalance(userId);

      return res.status(HttpStatus.OK).json({
        status: "ok",
        message: "Wallet balance fetched successfully",
        data,
      } as ApiResponse);
    },
  );
}
