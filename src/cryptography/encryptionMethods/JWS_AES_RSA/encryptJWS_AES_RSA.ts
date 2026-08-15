/**
 * Encryption Type : JWS_AES_RSA
 * JWS              : RS256
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { constants, createPrivateKey, publicEncrypt, sign, webcrypto } from 'node:crypto';
import { encodeBase64, encodeBase64Url, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';


const { serverPrivateKey, clientPublicKey } = getCryptoFunctionKeys();

export type JWSAESRSAResponse = {
    encResPayload: string;
    encResKey: string;
};

const IV = 'asdfghjkasdfghjk';

export async function encryptJWS_AES_RSA(
    context: RequestContext
): Promise<AppError | null> {

    // ===== Convert Payload to JSON =====

    let plaintext: string;

    try {
        plaintext = JSON.stringify(context.serviceResponse);
    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'INVALID_RESPONSE_PAYLOAD',
            message: 'Response payload could not be serialized to JSON',
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
            stringToBytes(plaintext)
        );

        const signingInput =
            `${protectedHeader}.${payload}`;

        const signature = sign(
            'RSA-SHA256',
            Buffer.from(signingInput),
            createPrivateKey(serverPrivateKey)
        );

        signedToken =
            `${signingInput}.${encodeBase64Url(signature)}`;

    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'JWS_AES_RSA_SIGNING_FAILED',
            message: 'Failed to sign response payload',
        };
    }

    // ===== Generate AES Key =====

    const aesKeyBytes = generateRandomBytes(32);

    // ===== AES-CBC Encryption =====

    let encryptedBuffer: ArrayBuffer;

    try {
        const aesKey = await webcrypto.subtle.importKey(
            'raw',
            new Uint8Array(aesKeyBytes),
            {
                name: 'AES-CBC',
            },
            false,
            ['encrypt']
        );

        encryptedBuffer =
            await webcrypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: stringToBytes(IV),
                },
                aesKey,
                stringToBytes(signedToken)
            );

    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'JWS_AES_RSA_ENCRYPTION_FAILED',
            message: 'Failed to encrypt response payload',
        };
    }

    // ===== RSA Encryption of AES Key =====

    let encryptedKey: Buffer;

    try {
        encryptedKey = publicEncrypt(
            {
                key: clientPublicKey,
                padding: constants.RSA_PKCS1_PADDING,
            },
            aesKeyBytes
        );

    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'JWS_AES_RSA_KEY_ENCRYPTION_FAILED',
            message: 'Failed to encrypt content encryption key',
        };
    }

    // ===== Final Output =====

    context.serviceResponse = {
        encResPayload: encodeBase64(
            new Uint8Array(encryptedBuffer)
        ),
        encResKey: encodeBase64(encryptedKey),
    } satisfies JWSAESRSAResponse;

    return null;
}