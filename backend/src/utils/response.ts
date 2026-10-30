import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  details?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  errorCode: string = 'INTERNAL_ERROR',
  details: any = null
): Response {
  const payload: ApiResponse = {
    success: false,
    message,
    errorCode,
    ...(details ? { details } : {}),
  };
  return res.status(statusCode).json(payload);
}
