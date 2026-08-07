import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';

export function encWrapperValidator(
  context: RequestContext
): AppError | null {

  let wrapper: {
    encPayload?: string;
    encKey?: string;
  };

  try {
    wrapper = JSON.parse(context.rawBody);
  } catch {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_ENCRYPTED_WRAPPER',
      message: 'Invalid encrypted payload wrapper',
    };
  }

  if (!wrapper.encPayload) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MISSING_ENC_PAYLOAD',
      message: 'encPayload is missing',
    };
  }

  context.payload = wrapper;

  return null;
}