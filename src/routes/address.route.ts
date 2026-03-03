/** @format */

import { AddressController } from "../controllers/address.controller.js";
import { roleGuardMiddleware } from "../middlewares/role-guard.middleware.js";
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { zodValidation } from "../middlewares/zod-validation.js";
import {
  createAddressSchema,
  editAddressSchema,
} from "../zod-schema/address.schema.js";

/**
 * @swagger
 * /api/v1/addresses/:
 *   post:
 *     summary: Create address
 *     tags: [Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ["city", "state", "country", "postalCode", "latitude", "longitude"]
 *             properties:
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               postalCode: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               address: { type: string }
 *               label: { type: string, enum: [home, work, other] }
 *               isDefault: { type: boolean }
 *     responses:
 *       "201":
 *         description: Address created successfully
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
 * /api/v1/addresses/edit/{addressId}:
 *   put:
 *     summary: Edit address
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *            type: string
 *            description: Edit Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address: { type: string }
 *               label: { type: string, enum: [home, work, other] }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               postalCode: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               isDefault: { type: boolean }
 *     responses:
 *       "200":
 *         description: Address updated successfully
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
 * /api/v1/addresses/toggle/{addressId}:
 *   put:
 *     summary: Toggle default address
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *            type: string
 *            required: true
 *            description: Toggle Address ID
 *     responses:
 *       "200":
 *         description: Default address set successfully
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
 * /api/v1/addresses/{addressId}:
 *   delete:
 *     summary: Delete address
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *            type: string
 *            description: Delete Address ID
 *     responses:
 *       "204":
 *         description: Address deleted successfully
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
 * /api/v1/addresses/me:
 *   get:
 *     summary: Get user addresses
 *     tags: [Address]
 *     responses:
 *       "200":
 *         description: User addresses fetched successfully
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

class AddressRouter {
  addressController: AddressController;
  router: Router;

  constructor() {
    this.addressController = new AddressController();
    this.router = Router();
    this.router.use(authMiddleware);
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.post(
      "/",
      roleGuardMiddleware(["customer", "vendor"]),
      zodValidation(createAddressSchema),
      this.addressController.createUserAddress,
    );

    this.router.put(
      "/edit/:id",
      roleGuardMiddleware(["customer", "vendor"]),
      zodValidation(editAddressSchema),
      this.addressController.editUserAddress,
    );

    this.router.put(
      "/toggle/:id",
      roleGuardMiddleware(["customer", "vendor"]),
      this.addressController.toggleDefaultAddress,
    );

    this.router.delete(
      "/:id",
      roleGuardMiddleware(["customer", "vendor", "admin"]),
      this.addressController.deleteUserAddress,
    );

    this.router.get(
      "/me",
      roleGuardMiddleware(["customer", "vendor"]),
      this.addressController.getUserAddresses,
    );
  }
}

export const addressRouter = new AddressRouter().router;
