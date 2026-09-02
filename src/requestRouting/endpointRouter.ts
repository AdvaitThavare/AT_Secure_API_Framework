import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';

export type Route = {
  service: string;
};

const routes = new Map<string, Route>([
  ['/echo', { service: 'echoService' }],
  ['/clientCryptography/encryptJWE', { service: 'clientencryptJWE' }],
  ['/clientCryptography/decryptJWE', { service: 'clientdecryptJWE' }],
  ['/clientCryptography/encryptAES_RSA', { service: 'clientencryptAES_RSA' }],
  ['/clientCryptography/decryptAES_RSA', { service: 'clientdecryptAES_RSA' }],
  ['/clientCryptography/encryptJWS_AES_RSA', { service: 'clientencryptJWS_AES_RSA' }],
  ['/clientCryptography/decryptJWS_AES_RSA', { service: 'clientdecryptJWS_AES_RSA' }],
]);

export function endpointRouter(
  context: RequestContext
): AppError | Route {
  const url = context.req.url ?? '/';

  const route = routes.get(url);

  if (route) {
    return route;
  }

  return {
    category: 'SERVER',
    statusCode: 404,
    errorCode: 'NOT_FOUND',
    message: 'Endpoint not found',
  };
}