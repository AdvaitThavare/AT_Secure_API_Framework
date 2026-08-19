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
import { createPrivateKey, } from 'node:crypto';
import { encodeBase64, encodeBase64Url, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { encryptAES_CBC } from '../../cryptoAlgorithms/AES_Utility/AES_CBC';
import { signRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Signature';
import { encryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';

const { serverPrivateKey, clientPublicKey } = getCryptoFunctionKeys();

export type JWSAESRSAResponse = {
    encResPayload: string;
    encResKey: string;
    iv: string;
};

export async function encryptJWS_AES_RSA(
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext
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
                    alg: cryptoExecutionContext.protocol?.alg,
                    typ: cryptoExecutionContext.protocol?.typ,
                })
            )
        );

        const payload = encodeBase64Url(
            stringToBytes(plaintext)
        );

        const signingInput =
            `${protectedHeader}.${payload}`;

        const signature = signRSA(
            createPrivateKey(serverPrivateKey),
            stringToBytes(signingInput),
            cryptoExecutionContext.signature?.algorithm!
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
    const iv = generateRandomBytes(16);

    // ===== AES-CBC Encryption =====

    let encryptedBuffer: ArrayBuffer;

    try {
        encryptedBuffer = await encryptAES_CBC(
            aesKeyBytes,
            iv,
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
        encryptedKey = encryptRSA(
            clientPublicKey,
            aesKeyBytes,
            cryptoExecutionContext.rsa?.padding!
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
        iv: encodeBase64(iv),
    } satisfies JWSAESRSAResponse;

    return null;
}