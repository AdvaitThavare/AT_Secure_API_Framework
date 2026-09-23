import type { APIRequestContext } from '@playwright/test';
import { ClientCryptoResponse } from './clientCryptoTypes';

export type ClientJWSAESRSAEncryptionResult = {
    encReqPayload: string;
    encReqKey: string;
    base64ivReq: string;
};

export type ClientJWSAESRSAResponse =
    ClientCryptoResponse<ClientJWSAESRSAEncryptionResult>;

export async function encryptClientJWSAESRSA(
    apiContext: APIRequestContext,
    payload: unknown,
    contentType: string
): Promise<ClientJWSAESRSAResponse> {

    const response = await apiContext.post(
        '/clientCryptography/encryptJWS_AES_RSA',
        {
            headers: {
                'x-at-client-id': 'AT-CLIENT-001',
                'x-at-client-secret': 'AT-SECRET-001',
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
            `Client JWS_AES_RSA encryption failed with status ${response.status()}`
        );
    }

    return await response.json() as ClientJWSAESRSAResponse;
}

export async function decryptClientJWSAESRSA(
    apiContext: APIRequestContext,
    encryptedResponse: ClientJWSAESRSAEncryptionResult
): Promise<ClientJWSAESRSAResponse> {

    const response = await apiContext.post(
        '/clientCryptography/decryptJWS_AES_RSA',
        {
            headers: {
                'x-at-client-id': 'AT-CLIENT-001',
                'x-at-client-secret': 'AT-SECRET-001',
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'content-type': 'application/json',
                'x-enc-wrapper-content-type': 'NA',
            },
            data: {
                encResPayload: encryptedResponse.encReqPayload,
                encResKey: encryptedResponse.encReqKey,
                base64ivRes: encryptedResponse.base64ivReq,
            },
        }
    );

    if (!response.ok()) {
        throw new Error(
            `Client JWS_AES_RSA decryption failed with status ${response.status()}`
        );
    }

    return await response.json() as ClientJWSAESRSAResponse;
}