/** @format */
import Cart, { CartDocument } from "../models/cart.model.js";
import Meal, { MealDocument } from "../models/meal.model.js";

export type CartAction = (
  cart: CartDocument,
  meal: MealDocument,
  quantity: number,
) => void;

export const CartActions: Record<string, CartAction> = {
  increment: (cart: CartDocument, meal: MealDocument, quantity: number) => {
    const existingMeal = cart.meals.find(
      (m) => m.mealId.toString() === meal._id.toString(),
    );
    if (existingMeal) {
      existingMeal.quantity += quantity;
    }
  },
  decrement: (cart: CartDocument, meal: MealDocument, quantity: number) => {
    const mealIndex = cart.meals.findIndex(
      (m) => m.mealId.toString() === meal._id.toString(),
    );
    if (mealIndex !== -1 && mealIndex !== undefined) {
      const item = cart.meals[mealIndex];
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        cart.meals.splice(mealIndex, 1);
      }
    }
  },
  add: (cart: CartDocument, meal: MealDocument, quantity: number) => {
    const existingMeal = cart.meals.find(
      (m) => m.mealId.toString() === meal._id.toString(),
    );
    if (existingMeal) {
      existingMeal.quantity += quantity;
    } else {
      cart.meals.push({
        mealId: meal._id,
        price: meal.price,
        quantity,
        totalPrice: meal.price * quantity,
      });
    }
  },
  remove: (cart: CartDocument, meal: MealDocument) => {
    cart.meals = cart.meals.filter(
      (m) => m.mealId.toString() !== meal._id.toString(),
    );
  },
};
