import type { ServiceResponse } from '../../serviceManagement/serviceResponse';

export function echoService(
  payload: unknown,
  contentType: string
): ServiceResponse {

  if (contentType.includes('application/json')) {
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