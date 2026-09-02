/**
 * Encryption Type : JWS_AES_RSA
 * JWS              : RS256
 * Token Type       : JWT
 * Signature        : RSA-SHA256
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Decryption   : RSA/ECB/PKCS1Padding
 * RSA Padding      : PKCS#1 v1.5
 */

import { constants, createPublicKey } from 'node:crypto';
import { decryptAES_CBC } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_CBC';
import { decryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { verifyRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Signature';
import { bytesToString, decodeBase64, decodeBase64Url, stringToBytes } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import { clientCryptoResponseSerializer } from '../clientCryptoResponseSerializer';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { getClientCryptoConfig } from '../clientCryptoConfig';

const { serverPublicKey, clientPrivateKey } = getClientCryptoConfig();

type ClientJWSAESRSADecryptRequest = {
    encResPayload: string;
    encResKey: string;
    base64iv: string;
};

export async function clientdecryptJWS_AES_RSA(
    context: ServiceContext
): Promise<ServiceResponse> {

    const {
        encResPayload,
        encResKey,
        base64iv,
    } = context.payload as ClientJWSAESRSADecryptRequest;

    if (
        typeof encResPayload !== 'string' ||
        typeof encResKey !== 'string' ||
        typeof base64iv !== 'string'
    ) {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_JWS_AES_RSA_REQUEST',
                message: 'encResPayload, encResKey and base64iv must be strings',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Convert AES Parameters =====

    const encryptedPayload = decodeBase64(encResPayload);
    const encryptedKey = decodeBase64(encResKey);
    const iv = decodeBase64(base64iv);

    // ===== RSA Decryption of AES Key =====

    let aesKey: Buffer;

    try {
        aesKey = decryptRSA(
            clientPrivateKey,
            encryptedKey,
            constants.RSA_PKCS1_PADDING
        );
    } catch {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_ENCRYPTED_KEY',
                message: 'Failed to decrypt content encryption key',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== AES-CBC Decryption =====

    let decryptedBuffer: ArrayBuffer;

    try {
        decryptedBuffer = await decryptAES_CBC(
            new Uint8Array(aesKey),
            iv,
            encryptedPayload
        );
    } catch {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_JWS_AES_RSA_PAYLOAD',
                message: 'Failed to decrypt JWS_AES_RSA payload',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Convert Decrypted Payload =====

    let signedToken: string;

    try {
        signedToken = bytesToString(decryptedBuffer);
    } catch {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_DECRYPTED_PAYLOAD',
                message: 'Decrypted payload is not valid text',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Split JWS =====

    const parts = signedToken.split('.');

    if (parts.length !== 3) {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_JWS',
                message: 'Invalid JWS format',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    const [
        protectedHeader,
        encodedPayload,
        encodedSignature,
    ] = parts;

    // ===== Decode Protected Header =====

    let header: {
        alg?: string;
        typ?: string;
    };

    try {
        header = JSON.parse(
            bytesToString(
                decodeBase64Url(protectedHeader)
            )
        );
    } catch {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_JWS',
                message: 'Invalid JWS protected header',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Verify JWS Configuration =====

    if (
        header.alg !== 'RS256' ||
        header.typ !== 'JWT'
    ) {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'UNSUPPORTED_JWS_CONFIGURATION',
                message: 'Unsupported JWS configuration',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Verify Signature =====

    let verified: boolean;

    try {
        const signingInput =
            `${protectedHeader}.${encodedPayload}`;

        verified = verifyRSA(
            createPublicKey(serverPublicKey),
            stringToBytes(signingInput),
            decodeBase64Url(encodedSignature),
            'RSA-SHA256'
        );
    } catch {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_JWS',
                message: 'Failed to verify JWS',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    if (!verified) {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_JWS_SIGNATURE',
                message: 'JWS signature verification failed',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Extract JWS Payload =====

    let decryptedPayload: string;

    try {
        decryptedPayload =
            bytesToString(
                decodeBase64Url(encodedPayload)
            );
    } catch {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_DECRYPTED_PAYLOAD',
                message: 'Decrypted payload is invalid',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Serialize Response =====

    const serializedResponse =
        clientCryptoResponseSerializer(
            stringToBytes(decryptedPayload).buffer
        );

    return {
        statusCode: 200,
        payload: serializedResponse.payload,
        responseHeaders: {
            'content-type': [serializedResponse.contentType],
        },
    };
}