import type { ServiceResponse } from '../../serviceManagement/serviceResponse';

export function responseSerializer(
  serviceResponse: ServiceResponse
): unknown {
  return serviceResponse.payloadContentType.includes('application/json')
    ? serviceResponse.payload
    : String(serviceResponse.payload);
}