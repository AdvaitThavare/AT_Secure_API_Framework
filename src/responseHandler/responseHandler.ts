import type { ServerResponse } from 'node:http';
import type { ServiceResponse } from '../serviceManagement/serviceResponse';

export function sendResponse(
  res: ServerResponse,
  serviceResponse: ServiceResponse,
  body: string
): void {  
  res.writeHead(
    serviceResponse.statusCode,
    serviceResponse.responseHeaders
  );

  res.end(body);
}