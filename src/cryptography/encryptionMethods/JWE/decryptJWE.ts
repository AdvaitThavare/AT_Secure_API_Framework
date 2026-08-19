/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * Signature       : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { bytesToString, decodeBase64Url, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { decryptAES_GCM } from '../../cryptoAlgorithms/AES_Utility/AES_GCM';
import { decryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { verifyAndGetJWEAlgorithm } from '../../algorithmAllowlist/JWEAllowlist';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';

const { serverPrivateKey } = getCryptoFunctionKeys();

export async function decryptJWE(
    context: RequestContext,
    cryptoExecutionContext: CryptoExecutionContext
): Promise<AppError | null> {
    const wrapper = context.encryptedWrapper;

    // ===== Split JWE =====

    const parts = wrapper!.payload.split('.');

    if (parts.length !== 5) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWE',
            message: 'Invalid JWE format',
        };
    }

    const [
        protectedHeader,
        encryptedKey,
        iv,
        cipherText,
        authenticationTag,
    ] = parts;

    // ===== Decode Protected Header =====

    let header: {
        alg?: string;
        enc?: string;
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
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWE',
            message: 'Invalid JWE protected header',
        };
    }

    // ===== Verify JWE Algorithm =====

    const algorithmConfiguration =
        verifyAndGetJWEAlgorithm(
            header.alg ?? '',
            header.enc ?? ''
        );

    if (!algorithmConfiguration) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'UNSUPPORTED_JWE_ALGORITHM',
            message: 'Unsupported JWE algorithm combination',
        };
    }

    // ===== Store Cryptographic Execution Context -1 =====

    cryptoExecutionContext.protocol = {
        alg: header.alg,
        enc: header.enc,
        typ: header.typ,
    };

    cryptoExecutionContext.rsa = {
        padding: algorithmConfiguration.rsaPadding,
        oaepHash: algorithmConfiguration.rsaOaepHash,
    };

    // ===== RSA Decryption =====

    let cek: Buffer;

    try {
        cek = decryptRSA(
            serverPrivateKey,
            decodeBase64Url(encryptedKey),
            algorithmConfiguration.rsaPadding,
            algorithmConfiguration.rsaOaepHash
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_KEY',
            message: 'Failed to decrypt content encryption key',
        };
    }

    // ===== Convert to Buffers =====

    const ivBytes = decodeBase64Url(iv);

    const cipherBytes = decodeBase64Url(cipherText);

    const tagBytes = decodeBase64Url(authenticationTag);

    const encryptedPayload = Buffer.concat([
        cipherBytes,
        tagBytes,
    ]);

    const aad = stringToBytes(protectedHeader);


    // ===== Store Cryptographic Execution Context -2 =====

    cryptoExecutionContext.aes = {
        keyLength: cek.length * 8,
        ivLength: ivBytes.length,
        tagLength: algorithmConfiguration.aesTagLength,
    };


    // ===== AES-GCM Decryption =====

    let decryptedBuffer: ArrayBuffer;

    try {
        decryptedBuffer = await decryptAES_GCM(
            new Uint8Array(cek),
            ivBytes,
            encryptedPayload,
            aad,
            algorithmConfiguration.aesTagLength
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWE_PAYLOAD',
            message: 'Failed to decrypt JWE payload',
        };
    }

    // ===== Final Output =====

    try {
        const decryptedString =
            bytesToString(
                decryptedBuffer
            );

        context.payload = JSON.parse(
            decryptedString
        );

        return null;

    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_DECRYPTED_PAYLOAD',
            message: 'Decrypted payload is not valid JSON',
        };
    }
}