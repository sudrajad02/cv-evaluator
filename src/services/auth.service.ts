import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma  from '../config/db';
import { ILoginRequest, ILoginResponse, IUserResponse } from '../interfaces/auth.interface';
import { ApiError } from '../utils/apiError';

export const AuthService = {
  async login(request: ILoginRequest): Promise<ILoginResponse> {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: request.username },
          ]
        },
        select: {
          id: true,
          name: true,
          username: true,
          password: true,
        }
      });
    
    if (!user) {
      throw new ApiError(401, 'Incorrect username or password');
    }

    const isMatch = await bcrypt.compare(request.password, user.password);
    
    if (!isMatch) {
      throw new ApiError(401, 'Incorrect username or password');
    }

    const jwtToken = this.generateToken(user.id.toString());
    

    // Update last login (optional)

    return {
      username: user.username,
      expired_at: jwtToken.expiresAt,
      token: jwtToken.token
    };
  },

  async logout(token: string): Promise<void> {
    // Implementasi sederhana tanpa blacklist:
    console.log(`Token logged out: ${token}`);
  },

  generateToken(userId: string): {token: string, expiresAt: string} {
    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'JWT secret not configured');
    }

    const expiresAt: string | number = process.env.JWT_EXPIRES_IN || '30m'
    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: expiresAt } as SignOptions
    );

    return {
      token,
      expiresAt
    };
  },

  verifyToken(token: string): { id: string } {
    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'JWT secret not configured');
    }

    try {
      return jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired token');
    }
  }
}