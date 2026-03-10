/** @format */

import { Router } from "express";
import { CartController } from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleGuardMiddleware } from "../middlewares/role-guard.middleware.js";
import { addToCartSchema } from "../zod-schema/cart.schema.js";
import { zodValidation } from "../middlewares/validation.js";

/**
 * @openapi
 * /api/v1/carts/{mealId}:
 *   post:
 *     summary: Add meal to cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: string
 *           required: true
 *           description: The meal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["quantity", "action"]
 *             properties:
 *               quantity:
 *                 type: number
 *                 required: true
 *                 description: The quantity of the meal to add to the cart
 *
 *               action:
 *                 type: string
 *                 required: true
 *                 enum: ["increment", "decrement"]
 *                 description: The action to perform on the meal in the cart
 *     responses:
 *       "200":
 *         description: Meal added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/401"
 *       "403":
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/403"
 *       "404":
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/404"
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/500"
 */

/**
 * @openapi
 * /api/v1/carts/{mealId}:
 *   delete:
 *     summary: Delete meal from cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: mealId
 *         required: true
 *         schema:
 *           type: string
 *           required: true
 *           description: The meal ID
 *     responses:
 *       "204":
 *         description: Meal deleted from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/401"
 *       "403":
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/403"
 *       "404":
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/404"
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/500"
 */

/**
 * @openapi
 * /api/v1/carts/me:
 *   get:
 *     summary: Get current user cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           required: true
 *           description: The user ID
 *     responses:
 *       "200":
 *         description: Cart fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiResponse"
 *       "401":
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/401"
 *       "403":
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/403"
 *       "404":
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/404"
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/responses/500"
 */

export class CartRouter {
  cartController: CartController;
  router: Router;
  constructor() {
    this.cartController = new CartController();
    this.router = Router();
    this.router.use(authMiddleware);
    this.router.use(roleGuardMiddleware(["customer"]));
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post(
      "/:mealId",
      zodValidation(addToCartSchema),
      this.cartController.addToCart,
    );
    this.router.delete("/:mealId", this.cartController.deleteFromCart);
    this.router.get("/me", this.cartController.getUserCart);
  }
}

export const cartRouter = new CartRouter().router;
