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
import { constants, privateDecrypt, webcrypto, } from 'node:crypto';
import fs from 'node:fs';
import { serverConfig } from '../../../config/serverConfig';

const privateKey = fs.readFileSync(
    serverConfig.certificates.key,
    'utf8'
);

const IV = 'asdfghjkasdfghjk';

export async function decryptAES_RSA(
    context: RequestContext
): Promise<AppError | null> {
    const wrapper = context.encryptedWrapper;

    // ===== RSA Decryption =====

    let decryptedKey: Buffer;

    try {
        decryptedKey = privateDecrypt(
            {
                key: privateKey,
                padding: constants.RSA_PKCS1_PADDING,
            },
            Buffer.from(wrapper!.key!, 'base64')
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_KEY',
            message: 'Failed to decrypt content encryption key',
        };
    }

    // ===== Convert AES Parameters =====

    const iv = new TextEncoder().encode(IV);

    const encryptedPayload = Buffer.from(
        wrapper!.payload,
        'base64'
    );

    // ===== AES-CBC Decryption =====

    let decryptedBuffer: ArrayBuffer;

    try {
        const aesKey = await webcrypto.subtle.importKey(
            'raw',
            new Uint8Array(decryptedKey),
            {
                name: 'AES-CBC',
            },
            false,
            ['decrypt']
        );

        decryptedBuffer = await webcrypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv,
            },
            aesKey,
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

    // ===== Convert Decrypted Payload to JSON =====

    try {
        const decryptedString = new TextDecoder().decode(
            decryptedBuffer
        );

        context.payload = JSON.parse(decryptedString);

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