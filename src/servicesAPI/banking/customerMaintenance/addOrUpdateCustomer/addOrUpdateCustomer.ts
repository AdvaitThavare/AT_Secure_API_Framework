import { basicAuthHelper } from '../../../../Authorization/BasicAuthorization/basicAuthHelper';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';

type CustomerCredentials = {
  username: string;
  password: string;
};

function validateCustomerCredential(
  credentials: CustomerCredentials
): boolean {
  return true;
}

function processAddUpdateCustomer(
  context: ServiceContext,
  customerId: string
): ServiceResponse {
  return {
    statusCode: 501,
    payload: {
      category: 'SERVER',
      statusCode: 501,
      errorCode: 'SERVICE_NOT_IMPLEMENTED',
      message: `addUpdateCustomer persistence is not implemented for customer ${customerId}`,
    },
    payloadContentType: 'application/json',
    responseHeaders: {},
  };
}

export function addUpdateCustomer(
  context: ServiceContext
): ServiceResponse {
  const credentials = basicAuthHelper(
    context.requestHeaders
  );

  if ('errorCode' in credentials) {
    return {
      statusCode: credentials.statusCode,
      payload: credentials,
      payloadContentType: 'application/json',
      responseHeaders: {},
    };
  }

  const credentialValidationResult =
    validateCustomerCredential(credentials);

  if (!credentialValidationResult) {
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

  return processAddUpdateCustomer(
    context,
    credentials.username
  );
}