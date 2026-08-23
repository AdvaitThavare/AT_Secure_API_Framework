import { echoService } from '../servicesAPI/miscellaneous/echoService';
import type { Route } from '../requestRouting/endpointRouter';
import type { ServiceResponse } from './serviceResponse';

type ServiceHandler = (
  payload: unknown,
  contentType: string
) => ServiceResponse;

const services = new Map<string, ServiceHandler>([
  ['echoService', echoService],
]);

export function serviceDispatcher(
  route: Route,
  payload: unknown,
  contentType: string
): ServiceResponse {

  return services.get(route.service)!(payload, contentType);
}