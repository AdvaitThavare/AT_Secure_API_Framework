import { echoService } from '../servicesAPI/miscellaneous/echoService';
import { clientencryptJWE } from '../servicesAPI/miscellaneous/clientCryptography/JWE/clientencryptJWE';
import type { Route } from '../requestRouting/endpointRouter';
import type { ServiceContext } from '../context/requestContext';
import type { ServiceResponse } from './serviceResponse';
import { clientdecryptJWE } from '../servicesAPI/miscellaneous/clientCryptography/JWE/clientdecryptJWE';

type ServiceHandler = (
  context: ServiceContext
) => ServiceResponse | Promise<ServiceResponse>;

const services = new Map<string, ServiceHandler>([
  ['echoService', echoService],
  ['clientencryptJWE', clientencryptJWE],
  ['clientdecryptJWE', clientdecryptJWE],
]);

export function serviceDispatcher(
  route: Route,
  context: ServiceContext
): ServiceResponse | Promise<ServiceResponse> {

  return services.get(route.service)!(context);
}