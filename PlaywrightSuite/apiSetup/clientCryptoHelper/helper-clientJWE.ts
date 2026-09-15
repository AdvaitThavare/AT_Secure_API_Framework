import type { APIRequestContext } from '@playwright/test';
import { ClientCryptoResponse } from './clientCryptoTypes';

export type ClientJWEEncryptionResult = {
    encReqPayload: string;
    encReqKey: string;
    base64ivReq: string;
};

export type ClientJWEResponse =
    ClientCryptoResponse<ClientJWEEncryptionResult>;

export async function encryptClientJWE(
    apiContext: APIRequestContext,
    payload: unknown,
    contentType: string
): Promise<ClientJWEResponse> {

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

    return await response.json() as ClientJWEResponse;
}

export async function decryptClientJWE(
    apiContext: APIRequestContext,
    encryptedResponse: string
): Promise<ClientJWEResponse> {

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

    return await response.json() as ClientJWEResponse;
}