/**
 * Encryption Type : JWS_AES_RSA
 * JWS              : RS256
 * Token Type       : JWT
 * Signature        : RSA-SHA256
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 * RSA Padding      : PKCS#1 v1.5
 */

import { constants, createPrivateKey } from 'node:crypto';
import { encryptAES_CBC } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_CBC';
import { signRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Signature';
import { encryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { clientCryptoRequestSerializer } from '../clientCryptoRequestSerializer';
import { encodeBase64, encodeBase64Url, generateRandomBytes, stringToBytes } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { getClientCryptoConfig } from '../clientCryptoConfig';

const { serverPublicKey, clientPrivateKey } = getClientCryptoConfig();

type ClientJWSAESRSAResponse = {
    encReqPayload: string;
    encReqKey: string;
    base64iv: string;
};

export async function clientencryptJWS_AES_RSA(
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

    // ===== Generate JWS =====

    let signedToken: string;

    try {
        const protectedHeader = encodeBase64Url(
            stringToBytes(
                JSON.stringify({
                    alg: 'RS256',
                    typ: 'JWT',
                })
            )
        );

        const payload = encodeBase64Url(
            stringToBytes(requestPayload)
        );

        const signingInput =
            `${protectedHeader}.${payload}`;

        const signature = signRSA(
            createPrivateKey(clientPrivateKey),
            stringToBytes(signingInput),
            'RSA-SHA256'
        );

        signedToken =
            `${signingInput}.${encodeBase64Url(signature)}`;

    } catch {
        return {
            statusCode: 500,
            payload: {
                errorCode: 'JWS_AES_RSA_SIGNING_FAILED',
                message: 'Failed to sign request payload',
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
            stringToBytes(signedToken)
        );
    } catch {
        return {
            statusCode: 500,
            payload: {
                errorCode: 'JWS_AES_RSA_ENCRYPTION_FAILED',
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
                errorCode: 'JWS_AES_RSA_KEY_ENCRYPTION_FAILED',
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
        } satisfies ClientJWSAESRSAResponse,
        responseHeaders: {
            'content-type': ['application/json'],
        },
    };
}