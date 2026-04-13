/** @format */

import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";
import {
  CloudinaryService,
  type CloudinaryAssetType,
} from "./cloudinary.service.js";

type UploadAssetType = CloudinaryAssetType;

export class UploadService {
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.cloudinaryService = new CloudinaryService();
  }

  createCloudinaryUploadSignature = (
    userId: string,
    userType: string,
    assetType: UploadAssetType,
  ) => {
    if (!userId || !userType) {
      throw new BadRequestException(
        "User context is required",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const roleToAssetMap: Record<string, UploadAssetType[]> = {
      customer: ["customerProfileImage"],
      vendor: ["vendorDocument", "vendorBusinessLogo", "mealImage"],
      admin: [],
    };

    if (!roleToAssetMap[userType]?.includes(assetType)) {
      throw new BadRequestException(
        "Asset type is not allowed for this user",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    return this.cloudinaryService.createUploadSignature(userId, assetType);
  };

  uploadImageFile = async (
    userId: string,
    userType: string,
    assetType: UploadAssetType,
    file: Express.Multer.File | undefined,
  ) => {
    if (!userId || !userType) {
      throw new BadRequestException(
        "User context is required",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException(
        "Image file is required",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const roleToAssetMap: Record<string, UploadAssetType[]> = {
      customer: ["customerProfileImage"],
      vendor: ["vendorDocument", "vendorBusinessLogo", "mealImage"],
      admin: [],
    };

    if (!roleToAssetMap[userType]?.includes(assetType)) {
      throw new BadRequestException(
        "Asset type is not allowed for this user",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const uploaded = await this.cloudinaryService.uploadImageBuffer(
      file.buffer,
      userId,
      assetType,
      file.originalname?.split(".").slice(0, -1).join(".") || "upload",
    );

    return {
      url: uploaded.secureUrl,
      publicId: uploaded.publicId,
    };
  };
}
