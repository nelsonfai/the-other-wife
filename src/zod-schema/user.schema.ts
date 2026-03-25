/** @format */

import z from "zod";

export const closeCurrentUserAccountSchema = z.object({
  password: z.string().trim().min(8),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended", "deleted"]),
});
