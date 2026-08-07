import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { decryptJWE } from './encryptionMethods/JWE/decryptJWE';
import { encryptJWE } from './encryptionMethods/JWE/encryptJWE';

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


// ===== Temporary Placeholders =====

async function decryptHigh(
  context: RequestContext
): Promise<AppError | null> {

  return null;
}

async function encryptHigh(
  context: RequestContext
): Promise<AppError | null> {

  return null;
}

async function decryptMedium(
  context: RequestContext
): Promise<AppError | null> {

  return null;
}

async function encryptMedium(
  context: RequestContext
): Promise<AppError | null> {

  return null;
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
    'HIGH',
    {
      decrypt: decryptHigh,
      encrypt: encryptHigh,
    },
  ],

  [
    'MEDIUM',
    {
      decrypt: decryptMedium,
      encrypt: encryptMedium,
    },
  ],
]);