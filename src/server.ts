import { createHTTPSServer, startHTTPSServer } from './serverManagement/httpsServer';
import { sendError } from './errors/errorHandler';
import { requestValidator } from './payloadFormatValidation/requestValidator';
import { methodRouter } from './requestRouting/methodRouter';
import { endpointRouter } from './requestRouting/endpointRouter';
import { serviceDispatcher } from './serviceManagement/serviceDispatcher';
import { payloadTypeIdentifier } from './requestRouting/payloadTypeIdentifier';
import { encWrapperValidator } from './payloadFormatValidation/encWrapperValidator';
import { decryptPayload, encryptPayload } from './cryptography/cryptographyLayer';
import { sendResponse } from './responseHandler/responseHandler';
import { responseSerializer } from './responseHandler/responseSerialization/responseSerializer';
import { requestHandler } from './requestHandler/requestHandler';


const server = createHTTPSServer(
  async (req, res) => {
    const context = await requestHandler(req);

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

    const serviceResponse =
      serviceDispatcher(
        route,
        context.payload,
        context.requestMediaType!
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
    }

    sendResponse(
      res,
      serviceResponse,
      responseBody,
      context.responseHeaders
    );
  });

startHTTPSServer(server);