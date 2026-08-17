/**
 * Encryption Type : AES_RSA
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 * Signature        : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { constants, } from 'node:crypto';
import { encodeBase64, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { encryptAES_CBC } from '../../cryptoAlgorithms/AES_Utility/AES_CBC';
import { encryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';

const { clientPublicKey } = getCryptoFunctionKeys();

export type AESRSAResponse = {
    encResPayload: string;
    encResKey: string;
    iv: string;
};
export async function encryptAES_RSA(
    context: RequestContext
): Promise<AppError | null> {
    // ===== Generate AES Key =====

    const aesKeyBytes = generateRandomBytes(32);
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

    // ===== AES-CBC Encryption =====

    let encryptedBuffer: ArrayBuffer;

    const iv = generateRandomBytes(16);

    try {
        encryptedBuffer = await encryptAES_CBC(
            aesKeyBytes,
            iv,
            stringToBytes(plaintext)
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'AES_RSA_ENCRYPTION_FAILED',
            message: 'Failed to encrypt response payload',
        };
    }

    // ===== RSA Encryption of AES Key =====

    let encryptedKey: Buffer;

    try {
        encryptedKey = encryptRSA(
            clientPublicKey,
            aesKeyBytes,
            constants.RSA_PKCS1_PADDING
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'AES_RSA_KEY_ENCRYPTION_FAILED',
            message: 'Failed to encrypt content encryption key',
        };
    }

    // ===== Final Output =====

    context.serviceResponse = {
        encResPayload: encodeBase64(new Uint8Array(encryptedBuffer)),
        encResKey: encodeBase64(encryptedKey),
        iv: encodeBase64(iv),
    } satisfies AESRSAResponse;

    return null;
}