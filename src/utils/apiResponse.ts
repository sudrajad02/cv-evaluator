import { Response } from 'express';

export class ApiResponse {
  static success(
    res: Response, 
    data: any = null, 
    message: string = 'Success'
  ) {
    res.status(200).json({
      success: true,
      message,
      data
    });
  }

  static created(res: Response, data: any, message: string = 'Created') {
    res.status(201).json({
      success: true,
      message,
      data
    });
  }

  static error(
    res: Response, 
    error: any, 
    statusCode: number = 400
  ) {
    res.status(statusCode).json({
      success: false,
      message: error.message || error || 'An error occurred',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }

  static notFound(res: Response, message: string = 'Not found') {
    res.status(404).json({
      success: false,
      message
    });
  }

  static unauthorized(res: Response, message: string = 'Unauthorized') {
    res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res: Response, message: string = 'Forbidden') {
    res.status(403).json({
      success: false,
      message
    });
  }
}