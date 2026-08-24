import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { normalizeMediaType } from './requestParsing/mediaTypeUtils';
import { requestParserMap } from './requestParsing/requestParsers';

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

  const contentType = normalizeMediaType(contentTypeValues[0]);
  context.requestMediaType = contentType;

  // ===== Request Parsing =====

  const parser = requestParserMap.get(contentType);

  if (!parser) {
    return {
      category: 'SERVER',
      statusCode: 415,
      errorCode: 'UNSUPPORTED_CONTENT_TYPE',
      message: 'Unsupported Content-Type',
    };
  }

  const parseResult = parser(context.requestRawBody);

  if (!parseResult.success) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_REQUEST_PAYLOAD',
      message: 'Invalid request payload or incompatible content type',
    };
  }

  context.payload = parseResult.payload;

  return null;
}