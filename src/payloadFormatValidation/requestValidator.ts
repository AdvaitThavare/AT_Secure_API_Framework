import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';

export function requestValidator(
  context: RequestContext
): AppError | null {

  const contentTypeValues = context.requestHeaders['content-type'];

  // ===== Content-Type Header =====

  if (!contentTypeValues?.length) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MISSING_CONTENT_TYPE',
      message: 'Content-Type header is missing',
    };
  }

  if (contentTypeValues.length > 1) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MULTIPLE_CONTENT_TYPE_VALUES',
      message: 'Multiple values for the same header are not allowed',
    };
  }

  const contentType = contentTypeValues[0];

  // ===== Validate Content-Type and Request Payload =====

  if (contentType.includes('application/json')) {
    try {
      context.payload = JSON.parse(context.requestRawBody);
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
    context.payload = context.requestRawBody;
    return null;
  }

  return {
    category: 'SERVER',
    statusCode: 415,
    errorCode: 'UNSUPPORTED_CONTENT_TYPE',
    message: 'Unsupported Content-Type',
  };
}