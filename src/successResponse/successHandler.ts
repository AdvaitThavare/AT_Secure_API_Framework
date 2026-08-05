import type { ServerResponse } from 'node:http';

export const responseConfig = {
  JSON: {
    statusCode: 200,
    contentType: 'application/json',
  },
  TEXT: {
    statusCode: 200,
    contentType: 'text/plain',
  },
};

export function sendResponse(
  res: ServerResponse,
  responseType: {
    statusCode: number;
    contentType: string;
  },
  body: string
): void {
  res.writeHead(responseType.statusCode, {
    'Content-Type': responseType.contentType,
  });

  res.end(body);
}