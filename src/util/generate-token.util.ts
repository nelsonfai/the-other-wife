/** @format */

import jwt from "jsonwebtoken";
import { jwtSecret, jwtRefreshSecret } from "../constants/constants.js";
import { UserDocument } from "../models/user.model.js";

export const generateToken = (user: UserDocument) => {
  const payload = { _id: user._id, userType: user.userType };
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: "15m",
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

export const verifyToken = (token: string, secret: string) =>
  jwt.verify(token, secret);
