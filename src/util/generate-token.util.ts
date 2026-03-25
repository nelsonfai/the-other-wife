/** @format */

import jwt from "jsonwebtoken";
import crypto from "crypto";
import { jwtSecret, jwtRefreshSecret } from "../constants/env.js";
import { UserDocument } from "../models/user.model.js";

export const generateToken = (user: UserDocument) => {
  const payload = { _id: user._id, userType: user.userType };
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: "30m",
  });

  return { token };
};

export const generateRefreshToken = (user: UserDocument) => {
  const refreshToken = jwt.sign(
    { _id: user._id, userType: user.userType },
    jwtRefreshSecret,
    {
      expiresIn: "7d",
    },
  );

  return { refreshToken };
};

export const generateEmailToken = () => ({
  emailToken: crypto.randomBytes(20).toString("hex"),
  emailTokenExpiry: new Date(Date.now() + 30 * 60 * 1000),
});

export const generateOtp = () => ({
  otp: Math.floor(1000 + Math.random() * 9000).toString(),
  otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
});

export const verifyToken = (token: string, secret: string) =>
  jwt.verify(token, secret);
