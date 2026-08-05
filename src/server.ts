import https from 'node:https';
import fs from 'node:fs';
import { serverConfig } from './config/serverConfig';
import { sendError } from './errors/errorHandler';
import { responseConfig, sendResponse } from './successResponse/successHandler';
import { validateGenericRequest } from './genericRequestValidation/genericRequestValidator';
import { methodRouter } from './requestRouting/methodRouter';
import { endpointRouter } from './requestRouting/endpointRouter';

const server = https.createServer(
  {
    key: fs.readFileSync(serverConfig.certificates.key),
    cert: fs.readFileSync(serverConfig.certificates.cert),
    ca: fs.readFileSync(serverConfig.certificates.ca), // Trust our local CA
    requestCert: true, // Require the client to present a certificate
    rejectUnauthorized: true, // Reject clients whose certificate is not trusted
  },
  (req, res) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString();
      const methodError = methodRouter(req);
      if (methodError) {
        sendError(res, methodError);
        return;
      }
      const route = endpointRouter(req);
      if ('statusCode' in route) {
        sendError(res, route);
        return;
      }
      const validationError = validateGenericRequest(req, rawBody);
      if (validationError) {
        sendError(res, validationError);
        return;
      }
      const contentType = req.headers['content-type'] ?? '';

      if (contentType.includes('application/json')) {
        try {
          const body = JSON.parse(rawBody);
          sendResponse(
            res,
            responseConfig.JSON,
            JSON.stringify(body)
          );
        } catch {
          sendError(res, {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JSON',
            message: 'Invalid JSON payload',
          });
        }
      } else if (contentType.includes('text/plain')) {
        sendResponse(
          res,
          responseConfig.TEXT,
          rawBody
        );
      } else {
        sendError(res, {
          category: 'SERVER',
          statusCode: 415,
          errorCode: 'UNSUPPORTED_CONTENT_TYPE',
          message: 'Unsupported Content-Type',
        });
      }
    });
  }
);

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log('mTLS Echo Server running at https://localhost:8443');
});