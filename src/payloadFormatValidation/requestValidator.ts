import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';

export function requestValidator(
  context: RequestContext
): AppError | null {

  if (context.payloadType === 'ENCRYPTED') {
    return null;
  }
  const contentType = context.contentType ?? '';

  if (contentType.includes('application/json')) {
    try {
      context.payload = JSON.parse(context.rawBody);
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
    context.payload = context.rawBody;
    return null;
  }

  return {
    category: 'SERVER',
    statusCode: 415,
    errorCode: 'UNSUPPORTED_CONTENT_TYPE',
    message: 'Unsupported Content-Type',
  };
}