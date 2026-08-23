import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import type { CryptoExecutionContext } from './CryptoExecutionContext';
import { decryptJWE } from './encryptionMethods/JWE/decryptJWE';
import { encryptJWE } from './encryptionMethods/JWE/encryptJWE';
import { decryptAES_RSA } from './encryptionMethods/AES_RSA/decryptAES_RSA';
import { encryptAES_RSA } from './encryptionMethods/AES_RSA/encryptAES_RSA';
import { decryptJWS_AES_RSA } from './encryptionMethods/JWS_AES_RSA/decryptJWS_AES_RSA';
import { encryptJWS_AES_RSA } from './encryptionMethods/JWS_AES_RSA/encryptJWS_AES_RSA';

type CryptoDecryptionHandler = (
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext
) => Promise<AppError | null>;

type CryptoEncryptionHandler = (
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext,
    responseBody: string
) => Promise<EncryptPayloadResult>;

type CryptoStrategy = {
    decrypt: CryptoDecryptionHandler;
    encrypt: CryptoEncryptionHandler;
};

export type DecryptPayloadResult = {
    error: AppError | null;
    cryptoExecutionContext: CryptoExecutionContext;
};

export type EncryptPayloadResult = {
    error: AppError | null;
    responseBody: string;
};

// ===== Public API =====

export async function decryptPayload(
    context: RequestContext
): Promise<DecryptPayloadResult> {

    const cryptoExecutionContext: CryptoExecutionContext = {};

    const handler = cryptoHandlers.get(
        context.encryptionType ?? ''
    );

    if (!handler) {
        return {
            error: {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_ENCRYPTION_TYPE',
                message: 'Unsupported encryption type',
            },
            cryptoExecutionContext,
        };
    }

    const error = await handler.decrypt(
        context,
        cryptoExecutionContext
    );

    return {
        error,
        cryptoExecutionContext,
    };
}

export async function encryptPayload(
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext,
    responseBody: string
): Promise<EncryptPayloadResult> {

    const handler = cryptoHandlers.get(
        context.encryptionType ?? ''
    );

    if (!handler) {
        return {
            error: {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_ENCRYPTION_TYPE',
                message: 'Unsupported encryption type',
            },
            responseBody: '',
        };
    }

    return await handler.encrypt(
        context,
        cryptoExecutionContext,
        responseBody
    );
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