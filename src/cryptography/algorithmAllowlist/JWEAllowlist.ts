/**
 * JWE Algorithm Allowlist
 *
 * Key Encryption : RSA-OAEP-256
 * Content Cipher : A256GCM
 */

import { constants } from 'node:crypto';

type JWEAlgorithmConfiguration = {
    rsaPadding: number;
    rsaOaepHash: string;
    aesKeyLength: number;
    aesTagLength: number;
};

const JWE_ALLOWLIST: ReadonlyMap<string, JWEAlgorithmConfiguration> =
    new Map([
        [
            'RSA-OAEP-256:A256GCM',
            {
                rsaPadding: constants.RSA_PKCS1_OAEP_PADDING,
                rsaOaepHash: 'sha256',
                aesKeyLength: 32,
                aesTagLength: 128,
            },
        ],
    ]);

export function verifyAndGetJWEAlgorithm(
    alg: string,
    enc: string
): JWEAlgorithmConfiguration | null {
    return (
        JWE_ALLOWLIST.get(`${alg}:${enc}`) ?? null
    );
}