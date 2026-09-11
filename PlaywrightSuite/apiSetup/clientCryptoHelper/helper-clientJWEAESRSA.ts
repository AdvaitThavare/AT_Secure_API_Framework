import type { APIRequestContext } from '@playwright/test';

export type ClientJWSAESRSAEncryptionResult = {
    encReqPayload: string;
    encReqKey: string;
    base64iv: string;
};

export async function encryptClientJWSAESRSA(
    apiContext: APIRequestContext,
    payload: unknown,
    contentType: string
): Promise<ClientJWSAESRSAEncryptionResult> {

    const response = await apiContext.post(
        '/clientCryptography/encryptJWS_AES_RSA',
        {
            headers: {
                'content-type': contentType,
            },
            data: payload,
        }
    );

    if (!response.ok()) {
        throw new Error(
            `Client JWS_AES_RSA encryption failed with status ${response.status()}`
        );
    }

    return await response.json() as ClientJWSAESRSAEncryptionResult;
}

export async function decryptClientJWSAESRSA(
    apiContext: APIRequestContext,
    encryptedResponse: ClientJWSAESRSAEncryptionResult
): Promise<unknown> {

    const response = await apiContext.post(
        '/clientCryptography/decryptJWS_AES_RSA',
        {
            headers: {
                'content-type': 'application/json',
            },
            data: {
                encResPayload: encryptedResponse.encReqPayload,
                encResKey: encryptedResponse.encReqKey,
                base64iv: encryptedResponse.base64iv,
            },
        }
    );

    if (!response.ok()) {
        throw new Error(
            `Client JWS_AES_RSA decryption failed with status ${response.status()}`
        );
    }

    const contentType = response.headers()['content-type'] ?? '';

    if (contentType.includes('application/json')) {
        return await response.json();
    }

    return await response.text();
}