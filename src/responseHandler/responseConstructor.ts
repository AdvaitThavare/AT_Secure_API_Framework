import type { ServiceResponse } from '../serviceManagement/serviceResponse';
import { responseSerializer } from './responseSerialization/responseSerializer';

export function responseConstructor(
    serviceResponse: ServiceResponse
): string {
    const responsePayload = responseSerializer(serviceResponse);

    return JSON.stringify({
        responseStatus: {
            success:
                serviceResponse.statusCode >= 200 &&
                serviceResponse.statusCode < 300,
        },
        responsePayload,
        responseContentType: serviceResponse.payloadContentType,
    });
}