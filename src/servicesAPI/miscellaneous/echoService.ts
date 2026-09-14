import { ServiceContext } from '../../context/requestContext';
import type { ServiceResponse } from '../../serviceManagement/serviceResponse';

export function echoService(
  context: ServiceContext
): ServiceResponse {

  const { payload, requestMediaType } = context;

  return {
    statusCode: 200,
    payload,
    payloadContentType: requestMediaType ?? '',
    responseHeaders: {},
  };
}