import { expect } from '@playwright/test';
import { test } from '../../../apiSetup/apiContext';
import { decryptClientJWE, encryptClientJWE } from '../../../apiSetup/clientCryptoHelper/helper-clientJWE';
import { decryptClientAESRSA, encryptClientAESRSA } from '../../../apiSetup/clientCryptoHelper/helper-clientAESRSA';
import { decryptClientJWSAESRSA, encryptClientJWSAESRSA } from '../../../apiSetup/clientCryptoHelper/helper-clientJWSAESRSA';


test('ENC_POS_001_JWEEchoRoundTrip_JSON', async ({ apiContext }) => {
    const payload = {
        customerId: 'CUST001',
        name: 'Advait',
        amount: 1000,
    };

    const contentType = 'application/json';

    const encryptedRequest = await encryptClientJWE(
        apiContext,
        payload,
        contentType
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWE',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
        },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    const decryptedResponse = await decryptClientJWE(
        apiContext,
        responseBody.encResPayload,
        contentType
    ) as {
        responsePayload: typeof payload;
        responseStatus: {
            success: boolean;
        };
    };

    expect(decryptedResponse.responsePayload).toEqual(payload);
    expect(decryptedResponse.responseStatus).toEqual({
        "success": true,
    });
});

test('ENC_POS_002_AESRSAEchoRoundTrip_JSON', async ({ apiContext }) => {
    const payload = {
        customerId: 'CUST001',
        name: 'Advait',
        amount: 1000,
    };

    const contentType = 'application/json';

    const encryptedRequest = await encryptClientAESRSA(
        apiContext,
        payload,
        contentType
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: encryptedRequest.encReqKey,
            base64iv: encryptedRequest.base64iv,
        },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    const decryptedResponse = await decryptClientAESRSA(
        apiContext,
        {
            encReqPayload: responseBody.encResPayload,
            encReqKey: responseBody.encResKey,
            base64iv: responseBody.base64iv,
        },
        contentType
    ) as {
        responsePayload: typeof payload;
        responseStatus: {
            success: boolean;
        };
    };

    expect(decryptedResponse.responsePayload).toEqual(payload);
    expect(decryptedResponse.responseStatus).toEqual({
        success: true,
    });
});

test('ENC_POS_003_JWSAESRSAEchoRoundTrip_JSON', async ({ apiContext }) => {
    const payload = {
        customerId: 'CUST001',
        name: 'Advait',
        amount: 1000,
    };

    const contentType = 'application/json';

    const encryptedRequest = await encryptClientJWSAESRSA(
        apiContext,
        payload,
        contentType
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: encryptedRequest.encReqKey,
            base64iv: encryptedRequest.base64iv,
        },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    const decryptedResponse = await decryptClientJWSAESRSA(
        apiContext,
        {
            encReqPayload: responseBody.encResPayload,
            encReqKey: responseBody.encResKey,
            base64iv: responseBody.base64iv,
        },
        contentType
    ) as {
        responsePayload: typeof payload;
        responseStatus: {
            success: boolean;
        };
    };

    expect(decryptedResponse.responsePayload).toEqual(payload);
    expect(decryptedResponse.responseStatus).toEqual({
        success: true,
    });
});

test('ENC_POS_004_JWEEchoRoundTrip_Text', async ({ apiContext }) => {
    const payload = 'Hello from JWE text payload';

    const contentType = 'text/plain';

    const encryptedRequest = await encryptClientJWE(
        apiContext,
        payload,
        contentType
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWE',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
        },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(contentType);

    const responseBody = await response.json();
    // console.log(responseBody)

    const decryptedResponse = await decryptClientJWE(
        apiContext,
        responseBody.encResPayload,
        contentType
    );

    expect(decryptedResponse).toBe(
        `success:true\nresponsePayload:${payload}`
    );
});

test('ENC_POS_005_AESRSAEchoRoundTrip_Text', async ({ apiContext }) => {
    const payload = 'Hello from AES_RSA text payload';

    const contentType = 'text/plain';

    const encryptedRequest = await encryptClientAESRSA(
        apiContext,
        payload,
        contentType
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: encryptedRequest.encReqKey,
            base64iv: encryptedRequest.base64iv,
        },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(contentType);

    const responseBody = await response.json();
    // console.log(responseBody)

    const decryptedResponse = await decryptClientAESRSA(
        apiContext,
        {
            encReqPayload: responseBody.encResPayload,
            encReqKey: responseBody.encResKey,
            base64iv: responseBody.base64iv,
        },
        contentType
    );

    expect(decryptedResponse).toBe(
        `success:true\nresponsePayload:${payload}`
    );
});

test('ENC_POS_006_JWSAESRSAEchoRoundTrip_Text', async ({ apiContext }) => {
    const payload = 'Hello from JWS_AES_RSA text payload';

    const contentType = 'text/plain';

    const encryptedRequest = await encryptClientJWSAESRSA(
        apiContext,
        payload,
        contentType
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: encryptedRequest.encReqKey,
            base64iv: encryptedRequest.base64iv,
        },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(contentType);

    const responseBody = await response.json();
    // console.log(responseBody)

    const decryptedResponse = await decryptClientJWSAESRSA(
        apiContext,
        {
            encReqPayload: responseBody.encResPayload,
            encReqKey: responseBody.encResKey,
            base64iv: responseBody.base64iv,
        },
        contentType
    );

    expect(decryptedResponse).toBe(
        `success:true\nresponsePayload:${payload}`
    );
});

