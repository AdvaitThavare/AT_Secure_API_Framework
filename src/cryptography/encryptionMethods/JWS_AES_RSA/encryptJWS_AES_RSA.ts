/**
 * Encryption Type : JWS_AES_RSA
 * JWS              : RS256
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 */

import type { RequestContext } from '../../../context/requestContext';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { createPrivateKey, } from 'node:crypto';
import { encodeBase64, encodeBase64Url, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { encryptAES_CBC } from '../../cryptoAlgorithms/AES_Utility/AES_CBC';
import { signRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Signature';
import { encryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';
import type { EncryptPayloadResult } from '../../cryptographyLayer';

const { serverPrivateKey, clientPublicKey } = getCryptoFunctionKeys();

export type JWSAESRSAResponse = {
    encResPayload: string;
    encResKey: string;
    iv: string;
};

export async function encryptJWS_AES_RSA(
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext,
    responseBody: string
): Promise<EncryptPayloadResult> {

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
            stringToBytes(responseBody)
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
            error: {
                category: 'SERVER',
                statusCode: 500,
                errorCode: 'JWS_AES_RSA_SIGNING_FAILED',
                message: 'Failed to sign response payload',
            },
            responseBody: '',
        };
    }

    // ===== Generate AES Key =====

    const aesKeyBytes = generateRandomBytes(cryptoExecutionContext.aes!.keyLength! / 8);

    const iv = generateRandomBytes(cryptoExecutionContext.aes!.ivLength!);

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
            error: {
                category: 'SERVER',
                statusCode: 500,
                errorCode: 'JWS_AES_RSA_ENCRYPTION_FAILED',
                message: 'Failed to encrypt response payload',
            },
            responseBody: '',
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
            error: {
                category: 'SERVER',
                statusCode: 500,
                errorCode: 'JWS_AES_RSA_KEY_ENCRYPTION_FAILED',
                message: 'Failed to encrypt content encryption key',
            },
            responseBody: '',
        };
    }

    // ===== Final Output =====

    return {
        error: null,
        responseBody: JSON.stringify({
            encResPayload: encodeBase64(new Uint8Array(encryptedBuffer)),
            encResKey: encodeBase64(encryptedKey),
            iv: encodeBase64(iv),
        } satisfies JWSAESRSAResponse),
    };
}