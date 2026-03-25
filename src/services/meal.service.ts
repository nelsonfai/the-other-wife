/** @format */

import mongoose, { ClientSession } from "mongoose";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { NotFoundException } from "../errors/not-found-exception.error.js";

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

      const vendor = await Vendor.findOne({ userId }).session(session);
      if (!vendor) {
        throw new BadRequestException(
          "Vendor not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const vendorId = vendor._id;

      const category = await MealCategory.findOne({
        category: categoryName,
      }).session(session);
      if (!category) {
        throw new BadRequestException(
          "Meal category not found",
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const categoryId = category._id;

      const [meal] = await Meal.create(
        [
          {
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
          },
        ],
        { session },
      );

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

  getMeals = async (
    data: {
      search?: string;
      tags?: string[];
      mealId?: string;
      category?: string;
    },
    pagination: { pageSize?: number; pageNumber?: number },
  ) => {
    const { search, tags = [], mealId, category } = data;
    const pageSize = Math.min(Math.max(pagination.pageSize ?? 10, 1), 50);
    const pageNumber = Math.max(pagination.pageNumber ?? 1, 1);
    const skip = (pageNumber - 1) * pageSize;

    const query: Record<string, any> = {
      isDeleted: false,
      isAvailable: "available",
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (Array.isArray(tags) && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (mealId) {
      query._id = mealId as unknown as mongoose.Types.ObjectId;
    }

    if (category) {
      const mealCategory = await MealCategory.findOne({ category });

      if (!mealCategory) {
        throw new NotFoundException(
          "Meal category not found",
          HttpStatus.NOT_FOUND,
          ErrorCode.RESOURCE_NOT_FOUND,
        );
      }

      query.categoryId = mealCategory._id as unknown as mongoose.Types.ObjectId;
    }

    const meals = await Meal.find(query)
      .populate("vendorId")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const totalMeals = await Meal.countDocuments(query);
    const totalPages = Math.ceil(totalMeals / pageSize);

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
  };
}
