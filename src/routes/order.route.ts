/** @format */

import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleGuardMiddleware } from "../middlewares/role-guard.middleware.js";

/**
 * @swagger
 * /api/v1/orders/me:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Order]
 *     responses:
 *       "200":
 *         description: Orders fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Get a current user's order by ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Order fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Not found
 */

class OrderRouter {
  orderController: OrderController;
  router: Router;

  constructor() {
    this.orderController = new OrderController();
    this.router = Router();
    this.router.use(authMiddleware);
    this.router.use(roleGuardMiddleware(["customer"]));
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get("/me", this.orderController.getUserOrders);
    this.router.get("/:orderId", this.orderController.getUserOrderById);
  }
}

export const orderRouter = new OrderRouter().router;
