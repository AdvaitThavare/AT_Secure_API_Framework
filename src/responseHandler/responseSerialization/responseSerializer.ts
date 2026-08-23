import type { ServiceResponse } from '../../serviceManagement/serviceResponse';

export function responseSerializer(
  serviceResponse: ServiceResponse
): string {

  const contentType =
    serviceResponse.responseHeaders['content-type']?.[0] ?? '';

  return contentType.includes('application/json')
    ? JSON.stringify(serviceResponse.payload)
    : String(serviceResponse.payload);
}