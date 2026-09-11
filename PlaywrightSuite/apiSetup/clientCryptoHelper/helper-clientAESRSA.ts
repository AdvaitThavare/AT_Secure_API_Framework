import type { APIRequestContext } from '@playwright/test';

export type ClientAESRSAEncryptionResult = {
    encReqPayload: string;
    encReqKey: string;
    base64iv: string;
};

export async function encryptClientAESRSA(
    apiContext: APIRequestContext,
    payload: unknown,
    contentType: string
): Promise<ClientAESRSAEncryptionResult> {

    const response = await apiContext.post(
        '/clientCryptography/encryptAES_RSA',
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
            `Client AES_RSA encryption failed with status ${response.status()}`
        );
    }

    return await response.json() as ClientAESRSAEncryptionResult;
}

export async function decryptClientAESRSA(
    apiContext: APIRequestContext,
    encryptedResponse: ClientAESRSAEncryptionResult,
    contentType: string
): Promise<unknown> {

    const response = await apiContext.post(
        '/clientCryptography/decryptAES_RSA',
        {
            headers: {
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'content-type': contentType,
                'x-enc-wrapper-content-type': 'NA',
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
            `Client AES_RSA decryption failed with status ${response.status()}`
        );
    }

    if (contentType.includes('application/json')) {
        return await response.json();
    }

    return await response.text();
}