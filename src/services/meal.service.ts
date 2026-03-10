/** @format */

import mongoose, { ClientSession } from "mongoose";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { BadRequestException } from "../errors/bad-request-exception.error.js";

import Meal from "../models/meal.model.js";
import Vendor from "../models/vendor.model.js";
import MealCategory from "../models/mealCategory.model.js";
import { transaction } from "../util/transaction.util.js";

export class MealService {
  constructor() {}

  createMeal = transaction.use(
    async (
      session: ClientSession,
      userId: string,
      mealData: {
        name: string;
        description: string;
        price: number;
        categoryName: string;
        availableFrom: string;
        availableUntil: string;
        primaryImageUrl: string;
        tags: string[];
      },
    ) => {
      const {
        name,
        description,
        price,
        categoryName,
        availableFrom,
        availableUntil,
        primaryImageUrl,
        tags,
      } = mealData;

      const vendor = await Vendor.findOne({ userId });
      if (!vendor) {
        throw new BadRequestException(
          "Vendor not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const vendorId = vendor._id;

      const category = await MealCategory.findOne({ category: categoryName });
      if (!category) {
        throw new BadRequestException(
          "Meal category not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const categoryId = category._id;

      const meal = await Meal.create({
        vendorId,
        name,
        categoryName,
        categoryId,
        description,
        price,
        availableFrom,
        availableUntil,
        primaryImageUrl,
        tags,
      });

      if (!meal) {
        throw new BadRequestException(
          "Meal not created",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      return { meal };
    },
  );

  getMeals = transaction.use(
    async (
      session: ClientSession,
      userId: string,
      data: {
        search: string;
        tags: string[];
        mealId: string;
        category: string;
      },
      pagination: { pageSize: number; pageNumber: number },
    ) => {
      userId &&
        (() => {
          throw new BadRequestException(
            "UserID is required",
            HttpStatus.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR,
          );
        })();

      const { search, tags, mealId, category } = data;
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const mealCategory = await MealCategory.findOne({ category }).session(
        session,
      );
      const categoryId = mealCategory?._id;

      if (!mealCategory) {
        throw new BadRequestException(
          "Meal category not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const query: Record<string, any> = {};

      search && (query.search = { $regex: search, $options: "i" });
      Array.isArray(tags) && tags.length > 0 && (query.tags = { $in: tags });
      mealId && (query._id = mealId as unknown as mongoose.Types.ObjectId);
      categoryId &&
        (query.categoryId = categoryId as unknown as mongoose.Types.ObjectId);

      const [meals] = await Meal.find(query)
        .populate("vendorId")
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .session(session);

      const totalMeals = await Meal.countDocuments(query).session(session);

      const totalPages = Math.ceil(totalMeals / pageSize);

      if (!meals) {
        throw new BadRequestException(
          "Meals not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      return {
        meals,
        pagination: {
          pageSize,
          pageNumber,
          totalMeals,
          totalPages,
          skip,
        },
      };
    },
  );
}
