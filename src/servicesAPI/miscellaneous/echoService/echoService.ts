import { basicAuthHelper } from '../../../Authorization/BasicAuthorization/basicAuthHelper';
import { echoClientDefinition } from './echoClientDefinition';
import type { ServiceContext } from '../../../context/requestContext';
import type { ServiceResponse } from '../../../serviceManagement/serviceResponse';

function validateEchoCredentials(
  username: string,
  password: string
): ServiceResponse | null {
  if (
    username !== echoClientDefinition.username ||
    password !== echoClientDefinition.password
  ) {
    return {
      statusCode: 401,
      payload: {
        category: 'SERVER',
        statusCode: 401,
        errorCode: 'BASIC_AUTHORIZATION_FAILURE',
        message: 'Incorrect Username or Password',
      },
      payloadContentType: 'application/json',
      responseHeaders: {},
    };
  }

  return null;
}

export function echoService(
  context: ServiceContext
): ServiceResponse {
  const credentials =
    basicAuthHelper(context.requestHeaders);

  if ('errorCode' in credentials) {
    return {
      statusCode: credentials.statusCode,
      payload: credentials,
      payloadContentType: 'application/json',
      responseHeaders: {},
    };
  }

  const authenticationError =
    validateEchoCredentials(
      credentials.username,
      credentials.password
    );

  if (authenticationError) {
    return authenticationError;
  }

  const { payload, requestMediaType } = context;

  return {
    statusCode: 200,
    payload,
    payloadContentType: requestMediaType ?? '',
    responseHeaders: {},
  };
}