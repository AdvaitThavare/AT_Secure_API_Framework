/**
 * JWS Algorithm Allowlist
 *
 * JWS Algorithm : RS256
 * Token Type    : JWT
 * Signature     : RSA-SHA256
 */

type JWSAlgorithmConfiguration = {
    signatureAlgorithm: string;
};

const JWS_ALLOWLIST: ReadonlyMap<string, JWSAlgorithmConfiguration> =
    new Map([
        [
            'RS256:JWT',
            {
                signatureAlgorithm: 'RSA-SHA256',
            },
        ],
    ]);

export function verifyAndGetJWSAlgorithm(
    alg: string,
    typ: string
): JWSAlgorithmConfiguration | null {
    return (
        JWS_ALLOWLIST.get(`${alg}:${typ}`) ?? null
    );
}