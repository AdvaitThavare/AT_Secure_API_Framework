
/**
 * Encryption Type : AES_RSA
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Decryption   : RSA/ECB/PKCS1Padding
 * RSA Padding      : PKCS#1 v1.5
 * Signature        : None
 */

import { constants } from 'node:crypto';
import { decryptAES_CBC } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_CBC';
import { decryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { decodeBase64 } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import { clientCryptoResponseSerializer } from '../clientCryptoResponseSerializer';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { getClientCryptoConfig } from '../clientCryptoConfig';

const { clientPrivateKey } = getClientCryptoConfig();

type ClientAESRSADecryptRequest = {
    encResPayload: string;
    encResKey: string;
    base64iv: string;
};

export async function clientdecryptAES_RSA(
    context: ServiceContext
): Promise<ServiceResponse> {

    const {
        encResPayload,
        encResKey,
        base64iv,
    } = context.payload as ClientAESRSADecryptRequest;

    if (
        typeof encResPayload !== 'string' ||
        typeof encResKey !== 'string' ||
        typeof base64iv !== 'string'
    ) {
        return {
            statusCode: 400,
            payload: {
                errorCode: 'INVALID_AES_RSA_REQUEST',
                message: 'encResPayload, encResKey and base64iv must be strings',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    const encryptedPayload = decodeBase64(encResPayload);
    const encryptedKey = decodeBase64(encResKey);
    const iv = decodeBase64(base64iv);

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
                errorCode: 'INVALID_AES_RSA_PAYLOAD',
                message: 'Failed to decrypt AES_RSA payload',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    const serializedResponse =
        clientCryptoResponseSerializer(
            decryptedBuffer
        );

    return {
        statusCode: 200,
        payload: serializedResponse.payload,
        responseHeaders: {
            'content-type': [serializedResponse.contentType],
        },
    };
}
