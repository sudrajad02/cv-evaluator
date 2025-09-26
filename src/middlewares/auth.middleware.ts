import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from "../utils/apiResponse";

declare module 'express' {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = {
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse(res, "Token required", 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      next();
    } catch (error) {
      return errorResponse(res, "Invalid token", 401);
    }
  },

  authorizeSelf: (req: Request, res: Response, next: NextFunction) => {
    if (req.params.id !== req.user.id) {
      return errorResponse(res, "You can only access your own data", 403);
    }
    next();
  }
};