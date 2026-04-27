/** @format */

import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleGuardMiddleware } from "../middlewares/role-guard.middleware.js";

/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get current customer wallet balance
 *     tags: [Wallet]
 *     responses:
 *       "200":
 *         description: Wallet balance fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
class WalletRouter {
  private walletController: WalletController;
  router: Router;

  constructor() {
    this.walletController = new WalletController();
    this.router = Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get(
      "/balance",
      authMiddleware,
      roleGuardMiddleware(["customer"]),
      this.walletController.getWalletBalance,
    );
  }
}

export const walletRouter = new WalletRouter().router;
