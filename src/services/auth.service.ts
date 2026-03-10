/** @format */

import { ClientSession } from "mongoose";

import { HttpStatus } from "../config/http.config.js";
import { ErrorCode } from "../enums/error-code.enum.js";

import { BadRequestException } from "../errors/bad-request-exception.error.js";
import { UnauthorizedExceptionError } from "../errors/unauthorized-exception.error.js";
import { NotFoundException } from "../errors/not-found-exception.error.js";

import User, { UserDocument } from "../models/user.model.js";
import Customer from "../models/customer.model.js";
import Vendor from "../models/vendor.model.js";

import {
  generateToken,
  generateRefreshToken,
  verifyToken,
} from "../util/generate-token.util.js";
import { jwtRefreshSecret, nodeEnv } from "../constants/constants.js";
import { transaction } from "../util/transaction.util.js";

export class AuthService {
  constructor() {}

  signup = transaction.use(
    async (
      session: ClientSession,
      body: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        userType: string;
        phoneNumber: string;
      },
    ): Promise<any> => {
      const { firstName, lastName, password, userType, phoneNumber, email } =
        body;

      try {
        const existingUser = await User.findOne({
          $or: [
            { ...(email && { email }) },
            { ...(phoneNumber && { phoneNumber }) },
          ],
        }).session(session);

        const authType = existingUser
          ? existingUser.email === email
            ? "email"
            : existingUser.phoneNumber === phoneNumber
              ? "phone number"
              : null
          : null;

        if (authType) {
          throw new BadRequestException(
            `${authType} already exists`,
            HttpStatus.BAD_REQUEST,
            authType === "email"
              ? ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
              : ErrorCode.AUTH_PHONE_NUMBER_ALREADY_EXISTS,
          );
        }

        const [newUser] = await User.create(
          [
            {
              firstName,
              lastName,
              email,
              passwordHash: password,
              userType,
              phoneNumber,
            },
          ],
          { session },
        );

        switch (userType) {
          case "customer":
            await Customer.create(
              [
                {
                  userId: newUser._id,
                },
              ],
              { session },
            );
            break;
          case "vendor":
            await Vendor.create(
              [
                {
                  userId: newUser._id,
                },
              ],
              { session },
            );
            break;
          case "admin":
            throw new BadRequestException(
              "Admin user cannot be created.",
              HttpStatus.BAD_REQUEST,
              ErrorCode.ACCESS_UNAUTHORIZED,
            );
          default:
            throw new Error("User type not specified.");
        }

        const { token: accessToken } = generateToken(newUser);
        const { refreshToken } = generateRefreshToken(newUser);

        await User.findByIdAndUpdate(newUser._id, {
          $set: {
            refreshToken,
            refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 1000),
          },
        }).session(session);

        return {
          accessToken,
          refreshToken,
          ...(newUser.omitPassword() as any),
        };
      } catch (error) {
        throw error;
      }
    },
  );

  login = transaction.use(
    async (
      session: ClientSession,
      body: {
        phoneNumber?: string;
        email?: string;
        password: string;
      },
    ): Promise<any> => {
      const { phoneNumber, email, password } = body;

      try {
        let user = await User.findOne(
          email ? { email } : { phoneNumber },
        ).session(session);

        if (!user) {
          throw new NotFoundException(
            `Incorrect ${email ? "email" : "phone number"}`,
            HttpStatus.NOT_FOUND,
            ErrorCode.AUTH_USER_NOT_FOUND,
          );
        }

        const isValid = await user.comparePassword(password);
        if (!isValid) {
          throw new UnauthorizedExceptionError(
            `Incorrect password`,
            HttpStatus.UNAUTHORIZED,
            ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
          );
        }

        const { token: accessToken } = generateToken(user);

        const { refreshToken } = generateRefreshToken(user);

        user = await User.findByIdAndUpdate(
          user._id,
          {
            $set: {
              lastLogin: new Date(),
              refreshToken,
              refreshTokenExpiry: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ),
            },
          },
          { new: true },
        ).session(session);

        const userWithoutPassword = user?.omitPassword();

        return {
          accessToken,
          refreshToken,
          ...userWithoutPassword,
        };
      } catch (error) {
        throw error;
      }
    },
  );

  refreshLogin = transaction.use(
    async (session: ClientSession, refreshToken: string) => {
      try {
        if (!refreshToken) {
          throw new BadRequestException(
            "Refresh token is required",
            HttpStatus.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR,
          );
        }

        const decoded = verifyToken(refreshToken, jwtRefreshSecret);

        if (!decoded || typeof decoded === "string") {
          throw new UnauthorizedExceptionError(
            "Invalid token",
            HttpStatus.UNAUTHORIZED,
            ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
          );
        }

        let user = await User.findOne({
          _id: decoded._id,
          refreshToken,
          refreshTokenExpiry: { $gt: new Date() },
        }).session(session);

        if (!user) {
          throw new NotFoundException(
            "Session expired",
            HttpStatus.NOT_FOUND,
            ErrorCode.AUTH_INVALID_TOKEN,
          );
        }

        const { token: newAccessToken } = generateToken(user);
        const { refreshToken: newRefreshToken } = generateRefreshToken(user);
        user = await User.findByIdAndUpdate(
          user._id,
          {
            $set: {
              refreshToken: newRefreshToken,
              refreshTokenExpiry: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ),
            },
          },
          { new: true },
        ).session(session);

        return {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          ...user?.omitPassword(),
        };
      } catch (error) {
        throw error;
      }
    },
  );

  logout = async (userId: string): Promise<any> => {
    if (!userId) {
      throw new BadRequestException(
        "User ID is required",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1, refreshTokenExpiry: 1 },
    });

    return {
      httpOnly: true,
      secure: nodeEnv === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(0),
    };
  };
}

// passwordResetRequest = async (phoneNumber: string) => {
//   const user = await User.findOne({ phoneNumber });

//   if (!user) {
//     throw new NotFoundException(
//       "User not found",
//       HttpStatus.NOT_FOUND,
//       ErrorCode.AUTH_USER_NOT_FOUND,
//     );
//   }

//   const token = Crypto.randomBytes(20).toString("hex");
//   user.resetToken = token;
//   user.resetTokenExpiry = Date.now() + 20 * 60 * 1000;
//   await user.save();

//   return { token };
// };

// passwordReset = async (newPassword: string, token: string) => {
//   const user = await User.findOne({
//     resetToken: token,
//     resetTokenExpiry: { $gt: Date.now(), $lt: Date.now() + 20 * 60 * 1000 },
//   });
//   if (!user) {
//     throw new NotFoundException(
//       "User not found",
//       HttpStatus.NOT_FOUND,
//       ErrorCode.AUTH_USER_NOT_FOUND,
//     );
//   }

//   user.passwordHash = await bcrypt.hash(newPassword, 10);
//   user.resetToken = null;
//   user.resetTokenExpiry = null;
//   await user.save();
// };
