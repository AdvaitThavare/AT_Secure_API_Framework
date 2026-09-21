import type { ServiceContext } from '../context/requestContext';
import type { ServiceResponse } from './serviceResponse';
import type { HttpMethod, ServiceDefinition, ServiceHandler } from './serviceRegistry';

function resolveServiceHandler(
  definition: ServiceDefinition,
  method: HttpMethod
): ServiceHandler {
  if (definition.service instanceof Map) {
    return definition.service.get(method)!;
  }

  return definition.service;
}

export function serviceDispatcher(
  definition: ServiceDefinition,
  context: ServiceContext,
  method: HttpMethod
): ServiceResponse | Promise<ServiceResponse> {
  const serviceHandler =
    resolveServiceHandler(
      definition,
      method
    );

  return serviceHandler(context);
}