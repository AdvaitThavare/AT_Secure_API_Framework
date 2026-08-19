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
import { constants, createPublicKey, } from 'node:crypto';
import { bytesToString, decodeBase64, decodeBase64Url, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { verifyAndGetJWSAlgorithm } from '../../algorithmAllowlist/JWSAllowlist';
import { decryptAES_CBC } from '../../cryptoAlgorithms/AES_Utility/AES_CBC';
import { verifyRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Signature';
import { decryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';

const { serverPrivateKey, clientPublicKey } = getCryptoFunctionKeys();

export async function decryptJWS_AES_RSA(
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
            decodeBase64(wrapper!.payload)
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWS_AES_RSA_PAYLOAD',
            message: 'Failed to decrypt JWS_AES_RSA payload',
        };
    }

    // ===== Convert Decrypted Payload =====

    let signedToken: string;

    try {
        signedToken =
            bytesToString(
                decryptedBuffer
            );

    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_DECRYPTED_PAYLOAD',
            message: 'Decrypted payload is not valid text',
        };
    }

    // ===== Split JWS =====

    const parts = signedToken.split('.');

    if (parts.length !== 3) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWS',
            message: 'Invalid JWS format',
        };
    }

    const [
        protectedHeader,
        encodedPayload,
        encodedSignature,
    ] = parts;

    // ===== Verify JWS =====

    let verified: boolean;

    // ===== Decode Protected Header =====

    try {
        const header = JSON.parse(
            bytesToString(
                decodeBase64Url(protectedHeader)
            )
        );

        // ===== Verify JWS Algorithm =====

        const algorithmConfiguration =
            verifyAndGetJWSAlgorithm(
                header.alg ?? '',
                header.typ ?? ''
            );

        if (!algorithmConfiguration) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'UNSUPPORTED_JWS_ALGORITHM',
                message: 'Unsupported JWS algorithm combination',
            };
        }

        // ===== Store Cryptographic Execution Context -3 =====

        cryptoExecutionContext.protocol = {
            alg: header.alg,
            typ: header.typ,
        };

        cryptoExecutionContext.signature = {
            algorithm: algorithmConfiguration.signatureAlgorithm,
        };

        // ===== Verify Signature =====

        const signingInput =
            `${protectedHeader}.${encodedPayload}`;

        verified = verifyRSA(
            createPublicKey(clientPublicKey),
            stringToBytes(signingInput),
            decodeBase64Url(encodedSignature),
            cryptoExecutionContext.signature.algorithm!
        );

    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWS',
            message: 'Failed to verify JWS',
        };
    }

    if (!verified) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_JWS_SIGNATURE',
            message: 'JWS signature verification failed',
        };
    }

    // ===== Extract JWS Payload =====

    try {
        const decryptedString =
            bytesToString(
                decodeBase64Url(encodedPayload)
            );

        context.payload =
            JSON.parse(decryptedString);

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