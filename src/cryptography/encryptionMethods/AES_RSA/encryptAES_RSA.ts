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

import {
    constants,
    publicEncrypt,
    randomBytes,
    webcrypto,
} from 'node:crypto';

import fs from 'node:fs';

import { serverConfig } from '../../../config/serverConfig';

const publicKey = fs.readFileSync(
    serverConfig.certificates.clientCert,
    'utf8'
);

export type AESRSAResponse = {
    encResPayload: string;
    encResKey: string;
};

const IV = 'asdfghjkasdfghjk';

export async function encryptAES_RSA(
    context: RequestContext
): Promise<AppError | null> {
    // ===== Generate AES Key =====

    const aesKeyBytes = randomBytes(32);
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

        encryptedBuffer = await webcrypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: new TextEncoder().encode(IV),
            },
            aesKey,
            new TextEncoder().encode(plaintext)
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
        encryptedKey = publicEncrypt(
            {
                key: publicKey,
                padding: constants.RSA_PKCS1_PADDING,
            },
            aesKeyBytes
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
        encResPayload: Buffer.from(encryptedBuffer).toString('base64'),
        encResKey: encryptedKey.toString('base64'),
    } satisfies AESRSAResponse;

    return null;
}