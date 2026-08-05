import type { IncomingMessage } from 'node:http';
import type { AppError } from '../errors/errorHandler';

export function validateGenericRequest(
  req: IncomingMessage,
  rawBody: string
): AppError | null {
  const contentType = req.headers['content-type'] ?? '';

  if (contentType.includes('application/json')) {
    try {
      JSON.parse(rawBody);
    } catch {
      return {
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_JSON',
        message: 'Invalid JSON payload',
      };
    }

    return null;
  }

  if (contentType.includes('text/plain')) {
    return null;
  }

  return {
    category: 'SERVER',
    statusCode: 415,
    errorCode: 'UNSUPPORTED_CONTENT_TYPE',
    message: 'Unsupported Content-Type',
  };
}