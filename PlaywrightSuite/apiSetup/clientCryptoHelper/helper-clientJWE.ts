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
                'content-type': contentType,
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
    encryptedResponse: string
): Promise<unknown> {

    const response = await apiContext.post(
        '/clientCryptography/decryptJWE',
        {
            headers: {
                'content-type': 'application/json',
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

    const contentType = response.headers()['content-type'] ?? '';

    if (contentType.includes('application/json')) {
        return await response.json();
    }

    return await response.text();
}