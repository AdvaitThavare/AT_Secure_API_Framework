import https from 'node:https';
import { serverConfig } from './serverManagement/serverConfig';
import { getTLSConfig } from './serverManagement/tlsConfig';
import { sendError } from './errors/errorHandler';
import { responseConfig, sendResponse } from './successResponse/successHandler';
import { requestValidator } from './payloadFormatValidation/requestValidator';
import { methodRouter } from './requestRouting/methodRouter';
import { endpointRouter } from './requestRouting/endpointRouter';
import type { RequestContext } from './context/requestContext';
import { serviceDispatcher } from './serviceManagement/serviceDispatcher';
import { payloadTypeIdentifier } from './requestRouting/payloadTypeIdentifier';
import { encWrapperValidator } from './payloadFormatValidation/encWrapperValidator';
import { decryptPayload, encryptPayload } from './cryptography/cryptographyLayer';
import { normalizeHeaders } from './context/headerUtils';

const server = https.createServer(
  getTLSConfig(),
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
        requestRawBody: rawBody,
        requestHeaders: normalizeHeaders(req.headers),
        responseHeaders: {},
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

      let cryptoExecutionContext;

      if (context.payloadType === 'ENCRYPTED') {
        const wrapperError = encWrapperValidator(context);

        if (wrapperError) {
          sendError(res, wrapperError);
          return;
        }

        const decryptResult = await decryptPayload(context);

        if (decryptResult.error) {
          sendError(res, decryptResult.error);
          return;
        }

        cryptoExecutionContext =
          decryptResult.cryptoExecutionContext;
      }

      const validationError = requestValidator(context);

      if (validationError) {
        sendError(res, validationError);
        return;
      }

      context.serviceResponse =
        serviceDispatcher(route, context.payload);

      if (context.payloadType === 'ENCRYPTED') {
        const encryptError = await encryptPayload(
          context,
          cryptoExecutionContext!
        );

        if (encryptError) {
          sendError(res, encryptError);
          return;
        }
      }

      const contentType =
        context.requestHeaders['content-type']?.[0] ?? '';

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