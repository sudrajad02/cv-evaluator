import { Response } from "express";
import { ApiResponse } from "../interfaces/api-response.interface";

// ✅ Success response
export function successResponse<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    code: statusCode,
    data,
  };
  return res.status(statusCode).json(response);
}

// ❌ Error response
export function errorResponse(
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  error: any = null
) {
  const response: ApiResponse<null> = {
    success: false,
    message,
    code: statusCode,
    error: error?.details || undefined,
  };
  return res.status(statusCode).json(response);
}
