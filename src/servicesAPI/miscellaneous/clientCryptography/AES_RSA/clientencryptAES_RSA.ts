/**
 * Encryption Type : AES_RSA
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 * RSA Padding      : PKCS#1 v1.5
 * Signature        : None
 */

import { constants } from 'node:crypto';
import { encryptAES_CBC } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_CBC';
import { encryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { encodeBase64, generateRandomBytes, stringToBytes } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { getClientCryptoConfig } from '../clientCryptoConfig';
import { clientCryptoRequestSerializer } from '../clientCryptoRequestSerializer';

const { serverPublicKey } = getClientCryptoConfig();

type ClientAESRSAResponse = {
    encReqPayload: string;
    encReqKey: string;
    base64iv: string;
};

export async function clientencryptAES_RSA(
    context: ServiceContext
): Promise<ServiceResponse> {

    const requestPayload = clientCryptoRequestSerializer(
        context.payload,
        context.requestMediaType!
    );

    if (requestPayload === null) {
        return {
            statusCode: 415,
            payload: {
                errorCode: 'UNSUPPORTED_CRYPTO_REQUEST_CONTENT_TYPE',
                message: 'Unsupported Content-Type for client cryptography service',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Generate AES Key =====

    const aesKey = generateRandomBytes(32);

    // ===== Generate IV =====

    const iv = generateRandomBytes(16);

    // ===== AES-CBC Encryption =====

    let encryptedBuffer: ArrayBuffer;

    try {
        encryptedBuffer = await encryptAES_CBC(
            aesKey,
            iv,
            stringToBytes(requestPayload)
        );
    } catch {
        return {
            statusCode: 500,
            payload: {
                errorCode: 'AES_RSA_ENCRYPTION_FAILED',
                message: 'Failed to encrypt request payload',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== RSA Encryption of AES Key =====

    let encryptedKey: Buffer;

    try {
        encryptedKey = encryptRSA(
            serverPublicKey,
            aesKey,
            constants.RSA_PKCS1_PADDING
        );
    } catch {
        return {
            statusCode: 500,
            payload: {
                errorCode: 'AES_RSA_KEY_ENCRYPTION_FAILED',
                message: 'Failed to encrypt content encryption key',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    // ===== Final Output =====

    return {
        statusCode: 200,
        payload: {
            encReqPayload: encodeBase64(
                new Uint8Array(encryptedBuffer)
            ),
            encReqKey: encodeBase64(encryptedKey),
            base64iv: encodeBase64(iv),
        } satisfies ClientAESRSAResponse,
        responseHeaders: {
            'content-type': ['application/json'],
        },
    };
}