import { echoService } from '../servicesAPI/miscellaneous/echoService';
import { clientencryptJWE } from '../servicesAPI/miscellaneous/clientCryptography/JWE/clientencryptJWE';
import type { Route } from '../requestRouting/endpointRouter';
import type { ServiceContext } from '../context/requestContext';
import type { ServiceResponse } from './serviceResponse';
import { clientdecryptJWE } from '../servicesAPI/miscellaneous/clientCryptography/JWE/clientdecryptJWE';
import { clientencryptAES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/AES_RSA/clientencryptAES_RSA';
import { clientdecryptAES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/AES_RSA/clientdecryptAES_RSA';
import { clientencryptJWS_AES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/JWS_AES_RSA/clientencryptJWS_AES_RSA';
import { clientdecryptJWS_AES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/JWS_AES_RSA/clientdecryptJWS_AES_RSA';

type ServiceHandler = (
  context: ServiceContext
) => ServiceResponse | Promise<ServiceResponse>;

const services = new Map<string, ServiceHandler>([
  ['echoService', echoService],
  ['clientencryptJWE', clientencryptJWE],
  ['clientdecryptJWE', clientdecryptJWE],
  ['clientencryptAES_RSA', clientencryptAES_RSA],
  ['clientdecryptAES_RSA', clientdecryptAES_RSA],
  ['clientencryptJWS_AES_RSA', clientencryptJWS_AES_RSA],
  ['clientdecryptJWS_AES_RSA', clientdecryptJWS_AES_RSA],
]);

export function serviceDispatcher(
  route: Route,
  context: ServiceContext
): ServiceResponse | Promise<ServiceResponse> {

  return services.get(route.service)!(context);
}