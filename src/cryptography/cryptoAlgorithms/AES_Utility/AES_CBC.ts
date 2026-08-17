/**
 * Algorithm        : AES-CBC
 * Web Crypto Name  : AES-CBC
 * Padding          : PKCS#7
 * Key Length       : Strategy-defined
 * IV Length        : Strategy-defined
 */

import { webcrypto } from 'node:crypto';

export async function encryptAES_CBC(
    key: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>,
    plaintext: Uint8Array<ArrayBuffer>
): Promise<ArrayBuffer> {
    const aesKey = await webcrypto.subtle.importKey(
        'raw',
        key,
        {
            name: 'AES-CBC',
        },
        false,
        ['encrypt']
    );

    return webcrypto.subtle.encrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        plaintext
    );
}

export async function decryptAES_CBC(
    key: Uint8Array<ArrayBuffer>,
    iv: Uint8Array<ArrayBuffer>,
    ciphertext: Uint8Array<ArrayBuffer>
): Promise<ArrayBuffer> {
    const aesKey = await webcrypto.subtle.importKey(
        'raw',
        key,
        {
            name: 'AES-CBC',
        },
        false,
        ['decrypt']
    );

    return webcrypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        ciphertext
    );
}