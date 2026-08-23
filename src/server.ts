import https from 'node:https';
import { serverConfig } from './serverManagement/serverConfig';
import { getTLSConfig } from './serverManagement/tlsConfig';
import { sendError } from './errors/errorHandler';
import { requestValidator } from './payloadFormatValidation/requestValidator';
import { methodRouter } from './requestRouting/methodRouter';
import { endpointRouter } from './requestRouting/endpointRouter';
import type { RequestContext } from './context/requestContext';
import { serviceDispatcher } from './serviceManagement/serviceDispatcher';
import { payloadTypeIdentifier } from './requestRouting/payloadTypeIdentifier';
import { encWrapperValidator } from './payloadFormatValidation/encWrapperValidator';
import { decryptPayload, encryptPayload } from './cryptography/cryptographyLayer';
import { normalizeHeaders } from './context/headerUtils';
import { sendResponse } from './responseHandler/responseHandler';
import { responseSerializer } from './responseHandler/responseSerialization/responseSerializer';
import { HEADER_ENC_WRAPPER_CONTENT_TYPE } from './constants/headerConstants';


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

      const contentType =
        context.requestHeaders['content-type']?.[0] ?? '';

      const serviceResponse =
        serviceDispatcher(
          route,
          context.payload,
          contentType
        );

      let responseBody =
        responseSerializer(serviceResponse);

      if (context.payloadType === 'ENCRYPTED') {
        const encryptResult = await encryptPayload(
          context,
          cryptoExecutionContext!,
          responseBody
        );

        if (encryptResult.error) {
          sendError(res, encryptResult.error);
          return;
        }

        responseBody = encryptResult.responseBody;
        serviceResponse.responseHeaders[HEADER_ENC_WRAPPER_CONTENT_TYPE] = ['application/json'];
      }

      sendResponse(
        res,
        serviceResponse,
        responseBody
      );
    });
  }
);

server.listen(serverConfig.port, serverConfig.host, () => {
  console.log('mTLS Echo Server running at https://localhost:8443');
});