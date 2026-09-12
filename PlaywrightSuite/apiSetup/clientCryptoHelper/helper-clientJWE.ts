import type { APIRequestContext } from '@playwright/test';

export type ClientJWEEncryptionResult = {
    encReqPayload: string;
    encReqKey: string;
    base64iv: string;
};

export async function encryptClientJWE(
    apiContext: APIRequestContext,
    payload: unknown,
    contentType: string
): Promise<ClientJWEEncryptionResult> {

    const response = await apiContext.post(
        '/clientCryptography/encryptJWE',
        {
            headers: {
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'content-type': contentType,
                'x-enc-wrapper-content-type': 'NA',
            },
            data: payload,
        }
    );

    if (!response.ok()) {
        throw new Error(
            `Client JWE encryption failed with status ${response.status()}`
        );
    }

    return await response.json() as ClientJWEEncryptionResult;
}

export async function decryptClientJWE(
    apiContext: APIRequestContext,
    encryptedResponse: string,
    contentType: string
): Promise<unknown> {

    const response = await apiContext.post(
        '/clientCryptography/decryptJWE',
        {
            headers: {
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'content-type': 'application/json',
                'x-enc-wrapper-content-type': 'NA',
            },
            data: {
                encResPayload: encryptedResponse,
            },
        }
    );

    if (!response.ok()) {
        throw new Error(
            `Client JWE decryption failed with status ${response.status()}`
        );
    }

    if (contentType.includes('application/json')) {
        return await response.json();
    }

    return await response.text();
}