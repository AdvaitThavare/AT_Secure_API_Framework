/**
 * Encryption Type : AES_RSA
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 * Signature        : None
 */

import type { RequestContext } from '../../../context/requestContext';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { encodeBase64, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { encryptAES_CBC } from '../../cryptoAlgorithms/AES_Utility/AES_CBC';
import { encryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';
import type { EncryptPayloadResult } from '../../cryptographyLayer';

const { clientPublicKey } = getCryptoFunctionKeys();

export type AESRSAResponse = {
    encResPayload: string;
    encResKey: string;
    iv: string;
};

export async function encryptAES_RSA(
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext,
    responseBody: string
): Promise<EncryptPayloadResult> {

    // ===== Generate AES Key =====

    const aesKeyBytes = generateRandomBytes(cryptoExecutionContext.aes!.keyLength! / 8);

    const iv = generateRandomBytes(cryptoExecutionContext.aes!.ivLength!);

    // ===== AES-CBC Encryption =====

    let encryptedBuffer: ArrayBuffer;

    try {
        encryptedBuffer = await encryptAES_CBC(
            aesKeyBytes,
            iv,
            stringToBytes(responseBody)
        );
    } catch {
        return {
            error: {
                category: 'SERVER',
                statusCode: 500,
                errorCode: 'AES_RSA_ENCRYPTION_FAILED',
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
                errorCode: 'AES_RSA_KEY_ENCRYPTION_FAILED',
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
        } satisfies AESRSAResponse),
    };
}