/** @format */

import z from "zod";

export const createAddressSchema = z.object({
  address: z.string(),
  label: z.enum(["home", "work", "other"]).optional(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  isDefault: z.boolean().optional(),
});

export const editAddressSchema = z.object({
  address: z.string().optional(),
  label: z.enum(["home", "work", "other"]).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
});
