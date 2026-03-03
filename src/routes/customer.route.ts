/** @format */

import { CustomerController } from "../controllers/customer.controller.js";
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleGuardMiddleware } from "../middlewares/role-guard.middleware.js";

/**
 * @swagger
 * /api/v1/customers/{id}:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           required: true
 *           description: The user ID to get the customer profile
 *     responses:
 *       "200":
 *         description: Customer profile fetched
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
 * @swagger
 * /api/v1/customers/{id}:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           required: true
 *           description: The user ID to update the customer profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [profileImageUrl]
 *             properties:
 *               profileImageUrl: { type: string }
 *     responses:
 *       "200":
 *         description: Customer updated
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
 * @swagger
 * /api/v1/customers/{id}:
 *   delete:
 *     summary: Delete customer profile
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           required: true
 *           description: The user ID to delete the customer profile
 *     responses:
 *       "204":
 *         description: Customer deleted
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

class CustomerRouter {
  customerController: CustomerController;
  router: Router;
  constructor() {
    this.customerController = new CustomerController();
    this.router = Router();
    this.router.use(authMiddleware);
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get(
      "/:id",
      roleGuardMiddleware(["customer", "admin"]),
      this.customerController.getCustomerProfile,
    );
    this.router.put(
      "/:id",
      roleGuardMiddleware(["customer"]),
      this.customerController.updateCustomerProfile,
    );
    this.router.delete(
      "/:id",
      roleGuardMiddleware(["customer", "admin"]),
      this.customerController.deleteCustomerProfile,
    );
  }
}

export const customerRouter = new CustomerRouter().router;
