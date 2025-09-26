import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/apiResponse";

export const AuthController = {
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const request = {
        username: req.body.username,
        password: req.body.password,
      };

      const result = await AuthService.login(request);

      return successResponse(res, result, "Login successful");
    } catch (err: any) {
      return errorResponse(res, err.message, 401);
    }
  },

  async logout(req: Request, res: Response): Promise<Response> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        await AuthService.logout(token);
      }

      return successResponse(res, null, "Logout successful");
    } catch (err: any) {
      return errorResponse(res, err.message, 401);
    }
  },
};
