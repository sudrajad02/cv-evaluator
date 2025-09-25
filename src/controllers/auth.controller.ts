import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

export const AuthController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const request = {
        username: req.body.username, 
        password: req.body.password
      }

      const { user, token } = await AuthService.login(request);
      
      ApiResponse.success(res, { user, token }, 'Login successful');
    } catch (error: any) {
      ApiResponse.error(res, error);
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        await AuthService.logout(token);
      }
      
      ApiResponse.success(res, null, 'Logout successful');
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }
}