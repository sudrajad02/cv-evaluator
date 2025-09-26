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
    data,
  };
  return res.status(statusCode).json(response);
}

// ❌ Error response
export function errorResponse(
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  error?: any
) {
  const response: ApiResponse<null> = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
}
