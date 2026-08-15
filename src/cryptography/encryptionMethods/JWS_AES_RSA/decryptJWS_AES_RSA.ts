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
import { constants, createPublicKey, privateDecrypt, verify, webcrypto } from 'node:crypto';
import { bytesToString, decodeBase64, decodeBase64Url, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';


const { serverPrivateKey, clientPublicKey } = getCryptoFunctionKeys();

const IV = 'asdfghjkasdfghjk';

export async function decryptJWS_AES_RSA(
    context: RequestContext
): Promise<AppError | null> {

    const wrapper = context.encryptedWrapper;

    // ===== RSA Decryption =====

    let decryptedKey: Buffer;

    try {
        decryptedKey = privateDecrypt(
            {
                key: serverPrivateKey,
                padding: constants.RSA_PKCS1_PADDING,
            },
            decodeBase64(wrapper!.key!)
        );

    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_KEY',
            message: 'Failed to decrypt content encryption key',
        };
    }

    // ===== AES-CBC Decryption =====

    let decryptedBuffer: ArrayBuffer;

    try {
        const aesKey =
            await webcrypto.subtle.importKey(
                'raw',
                new Uint8Array(decryptedKey),
                {
                    name: 'AES-CBC',
                },
                false,
                ['decrypt']
            );

        decryptedBuffer =
            await webcrypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: stringToBytes(IV),
                },
                aesKey,
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

    // ===== Verify JWS =====

    let verified: boolean;

    try {
        const parts =
            signedToken.split('.');

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

        const signingInput =
            `${protectedHeader}.${encodedPayload}`;

        verified = verify(
            'RSA-SHA256',
            Buffer.from(signingInput),
            createPublicKey(clientPublicKey),
            decodeBase64Url(encodedSignature)
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
        const encodedPayload =
            signedToken.split('.')[1];

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