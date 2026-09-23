import { createHTTPSServer, startHTTPSServer } from './serverManagement/httpsServer';
import { sendError } from './errors/errorHandler';
import { requestValidator } from './payloadFormatValidation/requestValidator';
import { endpointValidator } from './requestRouting/endPointValidator';
import { serviceDispatcher } from './serviceManagement/serviceDispatcher';
import { payloadTypeIdentifier } from './requestRouting/payloadTypeIdentifier';
import { encWrapperValidator } from './payloadFormatValidation/encWrapperValidator';
import { decryptPayload, encryptPayload } from './cryptography/cryptographyLayer';
import { sendResponse } from './responseHandler/responseHandler';
import { requestHandler } from './requestHandler/requestHandler';
import { createServiceContext } from './context/requestContext';
import { responseConstructor } from './responseHandler/responseConstructor';
import { type HttpMethod } from './serviceManagement/serviceRegistry';
import { clientAuthenticator } from './clientAuthentication/clientAuthenticator';

const server = createHTTPSServer(
  async (req, res) => {
    const context = await requestHandler(req);

    const serviceDefinitionError = endpointValidator(context);

    if (
      'statusCode' in serviceDefinitionError
    ) {
      sendError(res, serviceDefinitionError);
      return;
    }

    const serviceDefinition = serviceDefinitionError;

    const clientAuthenticationError =
      clientAuthenticator(
        context,
        serviceDefinition.serviceKey
      );

    if (clientAuthenticationError) {
      sendError(res, clientAuthenticationError);
      return;
    }

    const payloadTypeError = payloadTypeIdentifier(context);

    if (payloadTypeError) {
      sendError(res, payloadTypeError);
      return;
    }

    let cryptoExecutionContext;

    if (context.payloadType === 'ENCRYPTED') {
      const wrapperError =
        encWrapperValidator(context);

      if (wrapperError) {
        sendError(res, wrapperError);
        return;
      }

      const decryptResult =
        await decryptPayload(context);

      if (decryptResult.error) {
        sendError(res, decryptResult.error);
        return;
      }

      cryptoExecutionContext =
        decryptResult.cryptoExecutionContext;
    }

    const validationError =
      requestValidator(context);

    if (validationError) {
      sendError(res, validationError);
      return;
    }

    const serviceContext =
      createServiceContext(context);

    const serviceResponse =
      await serviceDispatcher(
        serviceDefinition,
        serviceContext,
        context.req.method as HttpMethod
      );

    let responseBody =
      responseConstructor(serviceResponse);

    if (context.payloadType === 'ENCRYPTED') {
      const encryptResult =
        await encryptPayload(
          context,
          cryptoExecutionContext!,
          responseBody
        );

      if (encryptResult.error) {
        sendError(res, encryptResult.error);
        return;
      }

      responseBody =
        encryptResult.responseBody;
    }

    sendResponse(
      res,
      serviceResponse,
      responseBody,
      context.responseHeaders
    );
  }
);

startHTTPSServer(server);