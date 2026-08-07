import { echoService } from '../servicesAPI/miscellaneous/echoService';
import type { Route } from '../requestRouting/endpointRouter';

type ServiceHandler = (
  payload: unknown
) => unknown;

const services = new Map<string, ServiceHandler>([
  ['echoService', echoService],
]);

export function serviceDispatcher(
  route: Route,
  payload: unknown
): unknown {
  return services.get(route.service)!(payload);
}