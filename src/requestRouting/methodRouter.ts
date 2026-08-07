import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';

const allowedMethods = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

export function methodRouter(
  context: RequestContext
): AppError | null {
  const method = context.req.method;

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