import { HEADER_PAYLOAD_STATE } from '../constants/headerConstants';
import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { serviceRegistry, type FrameworkFlow, type HttpMethod, type ServiceDefinition } from '../serviceManagement/serviceRegistry';

function findServiceDefinition(
    endpoint: string
): ServiceDefinition | undefined {
    return serviceRegistry.find(
        (definition) => definition.endpoint === endpoint
    );
}

function validateMethod(
    method: string | undefined,
    definition: ServiceDefinition
): AppError | null {
    if (
        !method ||
        !definition.allowedMethods.includes(method as HttpMethod)
    ) {
        return {
            category: 'SERVER',
            statusCode: 405,
            errorCode: 'METHOD_NOT_ALLOWED',
            message: `HTTP method '${method}' not allowed for ${definition.serviceKey}`,
        };
    }

    return null;
}

function validatePayloadState(
    context: RequestContext,
    definition: ServiceDefinition
): AppError | null {
    const payloadStateValues =
        context.requestHeaders[HEADER_PAYLOAD_STATE];

    if (!payloadStateValues) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'MISSING_REQUIRED_HEADERS',
            message: 'Mandatory headers are missing',
        };
    }

    if (payloadStateValues.length !== 1) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'MULTIPLE_HEADER_VALUES',
            message: 'Multiple values for the same header are not allowed',
        };
    }

    const payloadType =
        payloadStateValues[0] as FrameworkFlow;

    if (!definition.allowedFrameworkFlows.includes(payloadType)) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_HEADER_VALUE',
            message: 'Unsupported value passed in headers',
        };
    }

    context.payloadType = payloadType;

    return null;
}

function findMissingMandatoryHeaders(
    context: RequestContext,
    mandatoryHeaders: string[]
): string[] {
    return mandatoryHeaders.filter(
        (header) => !context.requestHeaders[header]
    );
}

function validateMandatoryServiceHeaders(
    context: RequestContext,
    definition: ServiceDefinition
): AppError | null {
    const missingHeaders =
        findMissingMandatoryHeaders(
            context,
            definition.mandatoryHeaders
        );

    if (missingHeaders.length === 0) {
        return null;
    }

    return {
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'MISSING_SERVICE_HEADERS',
        message: `Missing Service Headers: ${missingHeaders.join(', ')}`,
    };
}

export function endpointValidator(
    context: RequestContext
): AppError | ServiceDefinition {
    const endpoint = context.req.url ?? '/';

    const serviceDefinition =
        findServiceDefinition(endpoint);

    if (!serviceDefinition) {
        return {
            category: 'SERVER',
            statusCode: 404,
            errorCode: 'SERVICE_NOT_FOUND',
            message: 'API service not found',
        };
    }

    const methodError = validateMethod(
        context.req.method,
        serviceDefinition
    );

    if (methodError) {
        return methodError;
    }

    const payloadStateError =
        validatePayloadState(
            context,
            serviceDefinition
        );

    if (payloadStateError) {
        return payloadStateError;
    }

    const mandatoryServiceHeadersError =
        validateMandatoryServiceHeaders(
            context,
            serviceDefinition
        );

    if (mandatoryServiceHeadersError) {
        return mandatoryServiceHeadersError;
    }

    return serviceDefinition;
}