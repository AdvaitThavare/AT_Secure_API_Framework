/**
 * Algorithm        : AES-GCM
 * Web Crypto Name  : AES-GCM
 * Authentication   : GCM Authentication Tag
 * Tag Length       : Configurable
 * Key Length       : Strategy-defined
 * IV Length        : Strategy-defined
 * AAD              : Optional
 */

import { webcrypto } from 'node:crypto';

export async function encryptAES_GCM(
    key: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>,
    plaintext: Uint8Array<ArrayBuffer>,
    additionalData?: Uint8Array<ArrayBuffer>,
    tagLength = 128
): Promise<ArrayBuffer> {
    const aesKey = await webcrypto.subtle.importKey(
        'raw',
        key,
        {
            name: 'AES-GCM',
        },
        false,
        ['encrypt']
    );

    return webcrypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            ...(additionalData
                ? { additionalData }
                : {}),
            tagLength,
        },
        aesKey,
        plaintext
    );
}

export async function decryptAES_GCM(
    key: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>,
    ciphertext: Uint8Array<ArrayBuffer>,
    additionalData?: Uint8Array<ArrayBuffer>,
    tagLength = 128
): Promise<ArrayBuffer> {
    const aesKey = await webcrypto.subtle.importKey(
        'raw',
        key,
        {
            name: 'AES-GCM',
        },
        false,
        ['decrypt']
    );

    return webcrypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv,
            ...(additionalData
                ? { additionalData }
                : {}),
            tagLength,
        },
        aesKey,
        ciphertext
    );
}