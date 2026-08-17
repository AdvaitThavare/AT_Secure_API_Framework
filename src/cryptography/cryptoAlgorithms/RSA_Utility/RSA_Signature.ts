/**
 * Algorithm        : RSA Signature
 * Web Crypto Name  : N/A
 * Hash              : Strategy-defined
 */

import { sign, verify, type KeyObject } from 'node:crypto';

export function signRSA(
    privateKey: KeyObject,
    data: Uint8Array<ArrayBuffer>,
    algorithm: string
): Buffer {
    return sign(
        algorithm,
        data,
        privateKey
    );
}

export function verifyRSA(
    publicKey: KeyObject,
    data: Uint8Array<ArrayBuffer>,
    signature: Uint8Array<ArrayBuffer>,
    algorithm: string
): boolean {
    return verify(
        algorithm,
        data,
        publicKey,
        signature
    );
}