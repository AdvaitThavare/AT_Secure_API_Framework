import type { ServerResponse } from 'node:http';
import type { ServiceResponse } from '../serviceManagement/serviceResponse';

export function sendResponse(
  res: ServerResponse,
  serviceResponse: ServiceResponse,
  responseBody: string,
  responseHeaders: Record<string, string[]>
): void {

  const finalResponseHeaders = {
    ...serviceResponse.responseHeaders,
    ...responseHeaders,
  };

  res.writeHead(
    serviceResponse.statusCode,
    finalResponseHeaders
  );

  res.end(responseBody);
}