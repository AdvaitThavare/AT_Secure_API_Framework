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
import { constants, } from 'node:crypto';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { bytesToString, decodeBase64, } from '../../commonCrypto/commonCryptoUtilities';
import { decryptAES_CBC } from '../../cryptoAlgorithms/AES_Utility/AES_CBC';
import { decryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';

const { serverPrivateKey } = getCryptoFunctionKeys();

export async function decryptAES_RSA(
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext
): Promise<AppError | null> {
    const wrapper = context.encryptedWrapper;

    // ===== Convert AES Parameters =====

    const encryptedPayload = decodeBase64(
        wrapper!.payload
    );

    const iv = decodeBase64(wrapper!.iv!);

    // ===== Store Cryptographic Execution Context -1 =====

    cryptoExecutionContext.aes = {
        ivLength: iv.length,
    };

    cryptoExecutionContext.rsa = {
        padding: constants.RSA_PKCS1_PADDING,
    };

    // ===== RSA Decryption =====

    let decryptedKey: Buffer;

    try {
        decryptedKey = decryptRSA(
            serverPrivateKey,
            decodeBase64(wrapper!.key!),
            cryptoExecutionContext.rsa.padding!
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_KEY',
            message: 'Failed to decrypt content encryption key',
        };
    }

    // ===== Store Cryptographic Execution Context -2 =====

    cryptoExecutionContext.aes.keyLength = decryptedKey.length * 8;

    // ===== AES-CBC Decryption =====

    let decryptedBuffer: ArrayBuffer;

    try {
        decryptedBuffer = await decryptAES_CBC(
            new Uint8Array(decryptedKey),
            iv,
            encryptedPayload
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_AES_RSA_PAYLOAD',
            message: 'Failed to decrypt AES_RSA payload',
        };
    }

    // ===== Convert Decrypted Payload =====

    try {
        context.requestRawBody =
            bytesToString(
                decryptedBuffer
            );

        return null;

    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_DECRYPTED_PAYLOAD',
            message: 'Decrypted payload is invalid',
        };
    }
}