import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/apiResponse';

declare module 'express' {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = {
  authenticate: (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return ApiResponse.unauthorized(res, 'Authentication required');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded;
      next();
    } catch (error) {
      ApiResponse.unauthorized(res, 'Invalid token');
    }
  },

  authorizeSelf: (req: Request, res: Response, next: NextFunction) => {
    if (req.params.id !== req.user.id) {
      return ApiResponse.forbidden(res, 'You can only access your own data');
    }
    next();
  }
};