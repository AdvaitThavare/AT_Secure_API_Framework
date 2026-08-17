/**
 * Algorithm        : RSA Encryption / Decryption
 * Web Crypto Name  : N/A
 * Padding          : Strategy-defined
 * Hash             : Strategy-defined
 */

import { privateDecrypt, publicEncrypt } from 'node:crypto';

export function encryptRSA(
    publicKey: string,
    data: Uint8Array<ArrayBuffer>,
    padding: number,
    oaepHash?: string
): Buffer {
    return publicEncrypt(
        {
            key: publicKey,
            padding,
            ...(oaepHash
                ? { oaepHash }
                : {}),
        },
        data
    );
}

export function decryptRSA(
    privateKey: string,
    data: Uint8Array<ArrayBuffer>,
    padding: number,
    oaepHash?: string
): Buffer {
    return privateDecrypt(
        {
            key: privateKey,
            padding,
            ...(oaepHash
                ? { oaepHash }
                : {}),
        },
        data
    );
}