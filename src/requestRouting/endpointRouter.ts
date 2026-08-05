import type { IncomingMessage } from 'node:http';
import type { AppError } from '../errors/errorHandler';

export type Route = {
  service: string;
};

const routes = new Map<string, Route>([
  ['/echo', { service: 'echoService' }],
]);

export function endpointRouter(
  req: IncomingMessage
): Route | AppError {
  const url = req.url ?? '/';

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