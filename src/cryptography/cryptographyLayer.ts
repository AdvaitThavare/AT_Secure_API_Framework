import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { decryptJWE } from './encryptionMethods/JWE/decryptJWE';
import { encryptJWE } from './encryptionMethods/JWE/encryptJWE';
import { decryptAES_RSA } from './encryptionMethods/AES_RSA/decryptAES_RSA';
import { encryptAES_RSA } from './encryptionMethods/AES_RSA/encryptAES_RSA';
import { decryptJWS_AES_RSA } from './encryptionMethods/JWS_AES_RSA/decryptJWS_AES_RSA';
import { encryptJWS_AES_RSA } from './encryptionMethods/JWS_AES_RSA/encryptJWS_AES_RSA';

type CryptoHandler = (
  context: RequestContext
) => Promise<AppError | null>;

type CryptoStrategy = {
  decrypt: CryptoHandler;
  encrypt: CryptoHandler;
};

// ===== Public API =====

export async function decryptPayload(
  context: RequestContext
): Promise<AppError | null> {
  const handler = cryptoHandlers.get(
    context.encryptionType ?? ''
  );

  if (!handler) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_ENCRYPTION_TYPE',
      message: 'Unsupported encryption type',
    };
  }

  return await handler.decrypt(context);
}

export async function encryptPayload(
  context: RequestContext
): Promise<AppError | null> {
  const handler = cryptoHandlers.get(
    context.encryptionType ?? ''
  );

  if (!handler) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_ENCRYPTION_TYPE',
      message: 'Unsupported encryption type',
    };
  }

  return await handler.encrypt(context);
}

// ===== Cryptographic Strategies =====

const cryptoHandlers: Map<string, CryptoStrategy> = new Map([
  [
    'JWE',
    {
      decrypt: decryptJWE,
      encrypt: encryptJWE,
    },
  ],

  [
    'AES_RSA',
    {
      decrypt: decryptAES_RSA,
      encrypt: encryptAES_RSA,
    },
  ],
  [
    'JWS_AES_RSA',
    {
      decrypt: decryptJWS_AES_RSA,
      encrypt: encryptJWS_AES_RSA,
    },
  ],
]);