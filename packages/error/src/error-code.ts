import { z } from "zod";

export const ErrorCodes = [
  "BAD_REQUEST",
  "FORBIDDEN",
  "INTERNAL_SERVER_ERROR",
  "PAYMENT_REQUIRED",
  "DISABLED",
  "CONFLICT",
  "NOT_FOUND",
  "NOT_UNIQUE",
  "UNAUTHORIZED",
  "METHOD_NOT_ALLOWED",
  "UNPROCESSABLE_ENTITY",
] as const;

export const ErrorCodeEnum = z.enum(ErrorCodes);

export type ErrorCode = z.infer<typeof ErrorCodeEnum>;
