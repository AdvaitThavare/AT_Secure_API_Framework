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

import {
    constants,
    createPrivateKey,
    publicEncrypt,
    randomBytes,
    sign,
    webcrypto,
} from 'node:crypto';

import fs from 'node:fs';

import { serverConfig } from '../../../config/serverConfig';

const privateKey = fs.readFileSync(
    serverConfig.certificates.key,
    'utf8'
);

const publicKey = fs.readFileSync(
    serverConfig.certificates.clientCert,
    'utf8'
);

export type JWSAESRSAResponse = {
    encResPayload: string;
    encResKey: string;
};

const IV = 'asdfghjkasdfghjk';

export async function encryptJWS_AES_RSA(
    context: RequestContext
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
        const protectedHeader = Buffer.from(
            JSON.stringify({
                alg: 'RS256',
                typ: 'JWT',
            })
        ).toString('base64url');

        const payload = Buffer.from(
            plaintext
        ).toString('base64url');

        const signingInput =
            `${protectedHeader}.${payload}`;

        const signature = sign(
            'RSA-SHA256',
            Buffer.from(signingInput),
            createPrivateKey(privateKey)
        );

        signedToken =
            `${signingInput}.${signature.toString('base64url')}`;

    } catch {
        return {
            category: 'SERVER',
            statusCode: 500,
            errorCode: 'JWS_AES_RSA_SIGNING_FAILED',
            message: 'Failed to sign response payload',
        };
    }

    // ===== Generate AES Key =====

    const aesKeyBytes = randomBytes(32);

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

        encryptedBuffer =
            await webcrypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: new TextEncoder().encode(IV),
                },
                aesKey,
                new TextEncoder().encode(signedToken)
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
            errorCode: 'JWS_AES_RSA_KEY_ENCRYPTION_FAILED',
            message: 'Failed to encrypt content encryption key',
        };
    }

    // ===== Final Output =====

    context.serviceResponse = {
        encResPayload: Buffer.from(
            encryptedBuffer
        ).toString('base64'),

        encResKey: encryptedKey.toString('base64'),

    } satisfies JWSAESRSAResponse;

    return null;
}