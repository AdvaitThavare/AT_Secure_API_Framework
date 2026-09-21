import type { PayloadState } from '../constants/payloadIdentifierConstants';
import type { ServiceContext } from '../context/requestContext';
import type { ServiceResponse } from './serviceResponse';
import { echoService } from '../servicesAPI/miscellaneous/echoService';
import { clientdecryptJWE } from '../servicesAPI/miscellaneous/clientCryptography/JWE/clientdecryptJWE';
import { clientencryptJWE } from '../servicesAPI/miscellaneous/clientCryptography/JWE/clientencryptJWE';
import { clientdecryptAES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/AES_RSA/clientdecryptAES_RSA';
import { clientencryptAES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/AES_RSA/clientencryptAES_RSA';
import { clientdecryptJWS_AES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/JWS_AES_RSA/clientdecryptJWS_AES_RSA';
import { clientencryptJWS_AES_RSA } from '../servicesAPI/miscellaneous/clientCryptography/JWS_AES_RSA/clientencryptJWS_AES_RSA';

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

export type FrameworkFlow = PayloadState;

export type ServiceHandler = (
  context: ServiceContext
) => ServiceResponse | Promise<ServiceResponse>;

export type ServiceDefinition = {
  serviceKey: string;
  endpoint: string;
  allowedMethods: HttpMethod[];
  allowedFrameworkFlows: FrameworkFlow[];
  mandatoryHeaders: string[];
  service: ServiceHandler | Map<HttpMethod, ServiceHandler>;
};

export const serviceRegistry: ServiceDefinition[] = [
  {
    serviceKey: 'echoService',
    endpoint: '/echo',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN', 'ENCRYPTED'],
    mandatoryHeaders: [],
    service: echoService,
  },
  {
    serviceKey: 'clientdecryptAES_RSA',
    endpoint: '/clientCryptography/decryptAES_RSA',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN'],
    mandatoryHeaders: [],
    service: clientdecryptAES_RSA,
  },
  {
    serviceKey: 'clientencryptAES_RSA',
    endpoint: '/clientCryptography/encryptAES_RSA',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN'],
    mandatoryHeaders: [],
    service: clientencryptAES_RSA,
  },
  {
    serviceKey: 'clientdecryptJWE',
    endpoint: '/clientCryptography/decryptJWE',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN'],
    mandatoryHeaders: [],
    service: clientdecryptJWE,
  },
  {
    serviceKey: 'clientencryptJWE',
    endpoint: '/clientCryptography/encryptJWE',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN'],
    mandatoryHeaders: [],
    service: clientencryptJWE,
  },
  {
    serviceKey: 'clientdecryptJWS_AES_RSA',
    endpoint: '/clientCryptography/decryptJWS_AES_RSA',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN'],
    mandatoryHeaders: [],
    service: clientdecryptJWS_AES_RSA,
  },
  {
    serviceKey: 'clientencryptJWS_AES_RSA',
    endpoint: '/clientCryptography/encryptJWS_AES_RSA',
    allowedMethods: ['POST'],
    allowedFrameworkFlows: ['PLAIN'],
    mandatoryHeaders: [],
    service: clientencryptJWS_AES_RSA,
  },

  /*
  {
    serviceKey: 'dummy1Service',
    endpoint: '/dummy1',
    allowedMethods: ['GET', 'POST'],
    allowedFrameworkFlows: ['PLAIN', 'ENCRYPTED'],
    mandatoryHeaders: [],
    service: new Map<HttpMethod, ServiceHandler>([
      ['GET', dummy1GetService],
      ['POST', dummy1PostService],
    ]),
  },

  {
    serviceKey: 'dummy2Service',
    endpoint: '/dummy2',
    allowedMethods: ['GET', 'POST'],
    allowedFrameworkFlows: ['PLAIN', 'ENCRYPTED'],
    mandatoryHeaders: [],
    service: dummy2Service,
  },
  */
];