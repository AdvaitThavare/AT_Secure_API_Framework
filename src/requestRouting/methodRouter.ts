import type { IncomingMessage } from 'node:http';
import type { AppError } from '../errors/errorHandler';

const allowedMethods = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

export function methodRouter(
  req: IncomingMessage
): AppError | null {
  const method = req.method;

  if (method && allowedMethods.includes(method)) {
    return null;
  }

  return {
    category: 'SERVER',
    statusCode: 405,
    errorCode: 'METHOD_NOT_ALLOWED',
    message: 'HTTP method not allowed',
  };
}