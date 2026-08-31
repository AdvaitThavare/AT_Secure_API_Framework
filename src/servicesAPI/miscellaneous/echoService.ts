import { ServiceContext } from '../../context/requestContext';
import type { ServiceResponse } from '../../serviceManagement/serviceResponse';

export function echoService(
  context: ServiceContext
): ServiceResponse {
  
  const { payload, requestMediaType } = context;

  if (requestMediaType === 'application/json') {
    return {
      statusCode: 200,
      payload: {
        responseStatus: {
          success: true,
        },
        responsePayload: payload,
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  return {
    statusCode: 200,
    payload: `success:true\nresponsePayload:${payload}`,
    responseHeaders: {
      'content-type': ['text/plain'],
    },
  };
} 