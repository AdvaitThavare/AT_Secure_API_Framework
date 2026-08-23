import type { ServerResponse } from 'node:http';

export type ErrorCategory = 'SERVER';

export type AppError = {
  category: ErrorCategory;
  statusCode: number;
  errorCode: string;
  message: string;
};

export function sendError(
  res: ServerResponse,
  error: AppError
): void {
  res.writeHead(error.statusCode, {
    'Content-Type': 'application/json',
  });

  res.end(
    JSON.stringify({
      category: error.category,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      message: error.message,
    })
  );
}