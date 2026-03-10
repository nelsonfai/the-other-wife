/** @format */

import mongoose, { ClientSession } from "mongoose";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { NotFoundException } from "../errors/not-found-exception.error.js";
import Cart from "../models/cart.model.js";
import Meal from "../models/meal.model.js";
import { transaction } from "../util/transaction.util.js";

export class CartService {
  private recalculateTotalAmount = (cart: InstanceType<typeof Cart>) => {
    cart.meals.forEach((meal) => {
      meal.totalPrice = meal.price * meal.quantity;
    });

    cart.totalAmount = cart.meals.reduce(
      (total, meal) => total + meal.totalPrice,
      0,
    );
  };

  addToCart = transaction.use(
    async (
      session: ClientSession,
      customerId: string,
      mealId: string,
      quantity: number,
      action: "increment" | "decrement" | undefined,
    ) => {
      try {
        if (!customerId) {
          throw new BadRequestException(
            "User not found",
            HttpStatus.BAD_REQUEST,
            ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
          );
        }

        if (quantity < 1) {
          throw new BadRequestException(
            "Quantity must be at least 1",
            HttpStatus.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR,
          );
        }

        const meal = await Meal.findById(mealId).session(session);
        const existingCart = await Cart.findOne({ customerId }).session(
          session,
        );

        if (!meal) {
          throw new NotFoundException(
            "Meal not found",
            HttpStatus.NOT_FOUND,
            ErrorCode.RESOURCE_NOT_FOUND,
          );
        }

        if (existingCart) {
          const mealIndex = existingCart?.meals.findIndex(
            (meal) => meal.mealId.toString() === mealId,
          );

          if (mealIndex !== -1 && mealIndex !== undefined) {
            const existingMeal = existingCart.meals[mealIndex];
            if (action === "decrement") {
              existingMeal.quantity -= quantity;
              if (existingMeal.quantity <= 0) {
                existingCart.meals.splice(mealIndex, 1);
              } else {
                existingMeal.totalPrice =
                  existingMeal.price * existingMeal.quantity;
              }
            } else {
              existingMeal.quantity += quantity;
              existingMeal.totalPrice =
                existingMeal.price * existingMeal.quantity;
            }
          } else {
            const newMeal = {
              mealId: mealId as unknown as mongoose.Types.ObjectId,
              price: meal.price,
              quantity,
              totalPrice: meal.price * quantity,
            };
            existingCart.meals.push(newMeal);
          }

          this.recalculateTotalAmount(existingCart);

          await existingCart.save();
          return existingCart;
        } else {
          const [cart] = await Cart.create(
            [
              {
                customerId,
                meals: [
                  {
                    mealId: mealId as unknown as mongoose.Types.ObjectId,
                    price: meal.price,
                    quantity,
                    totalPrice: meal.price * quantity,
                  },
                ],
                totalAmount: meal.price * quantity,
              },
            ],
            { session },
          );

          return cart;
        }
      } catch (error) {
        throw error;
      }
    },
  );

  deleteFromCart = transaction.use(
    async (session: ClientSession, customerId: string, mealId: string) => {
      try {
        if (!customerId) {
          throw new BadRequestException(
            "User not found",
            HttpStatus.BAD_REQUEST,
            ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
          );
        }

        const meal = await Meal.findById(mealId).session(session);
        const existingCart = await Cart.findOne({ customerId }).session(
          session,
        );

        if (!meal) {
          throw new NotFoundException(
            "Meal not found",
            HttpStatus.NOT_FOUND,
            ErrorCode.RESOURCE_NOT_FOUND,
          );
        }

        if (existingCart) {
          const mealIndex = existingCart?.meals.findIndex(
            (meal) => meal.mealId.toString() === mealId,
          );

          if (mealIndex === -1 || mealIndex === undefined) {
            throw new NotFoundException(
              "Meal not found in cart",
              HttpStatus.NOT_FOUND,
              ErrorCode.RESOURCE_NOT_FOUND,
            );
          }

          existingCart.meals.splice(mealIndex, 1);
          this.recalculateTotalAmount(existingCart);

          await existingCart.save();
          return existingCart;
        }
      } catch (error) {
        throw error;
      }
    },
  );

  getUserCart = async (customerId: string) =>
    (await Cart.findOne({ customerId })) ??
    (() => {
      throw new NotFoundException(
        "Cart not found",
        HttpStatus.NOT_FOUND,
        ErrorCode.RESOURCE_NOT_FOUND,
      );
    })();
}
