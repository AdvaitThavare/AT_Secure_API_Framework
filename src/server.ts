import https from 'node:https';
import fs from 'node:fs';
import { serverConfig } from './config/serverConfig';
import { sendError } from './errors/errorHandler';
import { responseConfig, sendResponse } from './successResponse/successHandler';
import { requestValidator } from './payloadFormatValidation/requestValidator';
import { methodRouter } from './requestRouting/methodRouter';
import { endpointRouter } from './requestRouting/endpointRouter';
import type { RequestContext } from './context/requestContext';
import { serviceDispatcher } from './serviceManagement/serviceDispatcher';
import { payloadTypeIdentifier } from './requestRouting/payloadTypeIdentifier';
import { encWrapperValidator } from './payloadFormatValidation/encWrapperValidator';
import { decryptPayload,encryptPayload } from './cryptography/cryptographyLayer';

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

    req.on('end', async () => {
      const rawBody = Buffer.concat(chunks).toString();
      const context: RequestContext = {
        req,
        res,
        rawBody,
        contentType: req.headers['content-type'] ?? '',
      };
      const methodError = methodRouter(context);
      if (methodError) {
        sendError(res, methodError);
        return;
      }
      const route = endpointRouter(context);
      if ('statusCode' in route) {
        sendError(res, route);
        return;
      }

      const payloadTypeError = payloadTypeIdentifier(context);
      if (payloadTypeError) {
        sendError(res, payloadTypeError);
        return;
      }

      if (context.payloadType === 'ENCRYPTED') {

        const wrapperError = encWrapperValidator(context);
        if (wrapperError) {
          sendError(res, wrapperError);
          return;
        }

        const decryptError = await decryptPayload(context);
        if (decryptError) {
          sendError(res, decryptError);
          return;
        }
      }

      const validationError = requestValidator(context);
      if (validationError) {
        sendError(res, validationError);
        return;
      }
      const contentType = context.contentType ?? '';

      context.serviceResponse = serviceDispatcher(route, context.payload);

      if (context.payloadType === 'ENCRYPTED') {
        const encryptError = await encryptPayload(context);
        if (encryptError) {
          sendError(res, encryptError);
          return;
        }
      }
      sendResponse(
        res,
        contentType.includes('application/json')
          ? responseConfig.JSON
          : responseConfig.TEXT,
        JSON.stringify(context.serviceResponse)
      );
    });
  }
);

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log('mTLS Echo Server running at https://localhost:8443');
});