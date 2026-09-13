import { expect } from '@playwright/test';
import { test } from '../../../apiSetup/apiContext';
import { decryptClientJWE, encryptClientJWE } from '../../../apiSetup/clientCryptoHelper/helper-clientJWE';
import { decryptClientAESRSA, encryptClientAESRSA } from '../../../apiSetup/clientCryptoHelper/helper-clientAESRSA';
import { decryptClientJWSAESRSA, encryptClientJWSAESRSA } from '../../../apiSetup/clientCryptoHelper/helper-clientJWSAESRSA';

test('ENC_NEG_001_JWE_InvalidEncryptedWrapper', async ({ apiContext }) => {
    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWE',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: 'invalid encrypted wrapper',
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_ENCRYPTED_WRAPPER',
        message: 'Invalid encrypted payload wrapper',
    });
});

test('ENC_NEG_002_AESRSA_InvalidEncryptedWrapper', async ({ apiContext }) => {
    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: 'invalid encrypted wrapper',
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_ENCRYPTED_WRAPPER',
        message: 'Invalid encrypted payload wrapper',
    });
});

test('ENC_NEG_003_JWSAESRSA_InvalidEncryptedWrapper', async ({ apiContext }) => {
    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: 'invalid encrypted wrapper',
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_ENCRYPTED_WRAPPER',
        message: 'Invalid encrypted payload wrapper',
    });
});

test('ENC_NEG_004_JWE_CorruptedCiphertext', async ({ apiContext }) => {
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

    const jweParts = encryptedRequest.encReqPayload.split('.');

    jweParts[3] =
        jweParts[3].slice(0, -1) +
        (jweParts[3].slice(-1) === 'A' ? 'B' : 'A');

    const corruptedJWE = jweParts.join('.');

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWE',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: corruptedJWE,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_JWE_PAYLOAD',
        message: 'Failed to decrypt JWE payload',
    });
});

test('ENC_NEG_005_AESRSA_CorruptedCiphertext', async ({ apiContext }) => {
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

    const corruptedPayload = 'invalidencResPayloadString'

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: corruptedPayload,
            encReqKey: encryptedRequest.encReqKey,
            base64ivReq: encryptedRequest.base64ivReq,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_AES_RSA_PAYLOAD',
        message: 'Failed to decrypt AES_RSA payload',
    });
});

test('ENC_NEG_006_JWSAESRSA_CorruptedCiphertext', async ({ apiContext }) => {
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

    const corruptedPayload = 'invalidencResPayload';

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: corruptedPayload,
            encReqKey: encryptedRequest.encReqKey,
            base64ivReq: encryptedRequest.base64ivReq,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_JWS_AES_RSA_PAYLOAD',
        message: 'Failed to decrypt JWS_AES_RSA payload',
    });
});

test('ENC_NEG_010_AES_RSA_CEKDecryptionFailed', async ({ apiContext }) => {
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

    const invalidEncryptedKey = 'A' + encryptedRequest.encReqKey;

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: invalidEncryptedKey,
            base64ivReq: encryptedRequest.base64ivReq,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_ENCRYPTED_KEY',
        message: 'Failed to decrypt content encryption key',
    });
});

test('ENC_NEG_011_AES_RSA_InvalidCEK', async ({ apiContext }) => {
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

    const invalidEncryptedKey = 'invalidCEK';

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: invalidEncryptedKey,
            base64ivReq: encryptedRequest.base64ivReq,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_CEK',
        message: 'Invalid content encryption key',
    });
});

test('ENC_NEG_012_JWSAESRSA_CEKDecryptionFailed', async ({ apiContext }) => {
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

    const invalidEncryptedKey = 'A' + encryptedRequest.encReqKey;

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: invalidEncryptedKey,
            base64ivReq: encryptedRequest.base64ivReq,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_ENCRYPTED_KEY',
        message: 'Failed to decrypt content encryption key',
    });
});

test('ENC_NEG_013_JWSAESRSA_InvalidCEK', async ({ apiContext }) => {
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

    const invalidEncryptedKey = 'invalidCEK';

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': contentType,
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: encryptedRequest.encReqPayload,
            encReqKey: invalidEncryptedKey,
            base64ivReq: encryptedRequest.base64ivReq,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_CEK',
        message: 'Invalid content encryption key',
    });
});

test('ENC_NEG_014_AES_RSA_InvalidIV', async ({ apiContext }) => {
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

    const invalidbase64iv = 'invalidIV';

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
            base64iv: invalidbase64iv,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_IV',
        message: 'Invalid IV format',
    });
});

test('ENC_NEG_015_JWSAESRSA_InvalidIV', async ({ apiContext }) => {
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

    const invalidbase64iv = 'invalidIV';

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
            base64iv: invalidbase64iv,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_IV',
        message: 'Invalid IV format',
    });
});

test('ENC_NEG_016_AES_RSA_IncorrectIVlength', async ({ apiContext }) => {
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

    const invalidbase64iv = Buffer.alloc(11).toString('base64');;

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
            base64iv: invalidbase64iv,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_IV',
        message: 'Invalid IV length',
    });
});

test('ENC_NEG_017_JWSAESRSA_IncorrectIVlength', async ({ apiContext }) => {
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

    const invalidbase64iv = Buffer.alloc(11).toString('base64');;

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
            base64iv: invalidbase64iv,
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_IV',
        message: 'Invalid IV length',
    });
});

// test('ENC_NEG_018_JWSAESRSA_SignatureVerificationFailure', async ({ apiContext }) => {
//     const payload = {
//         customerId: 'CUST001',
//         name: 'Advait',
//         amount: 1000,
//     };

//     const contentType = 'application/json';

//     const encryptedRequest = await encryptClientJWSAESRSA(
//         apiContext,
//         payload,
//         contentType
//     );

//     const jwsParts = Buffer.from(
//         encryptedRequest.encReqPayload,
//         'base64'
//     ).toString('utf-8').split('.');

//     const signatureBytes = Buffer.from(
//         jwsParts[2],
//         'base64url'
//     );

//     signatureBytes[0] ^= 0x01;

//     jwsParts[2] = signatureBytes.toString('base64url');

//     const corruptedJWS = Buffer.from(
//         jwsParts.join('.'),
//         'utf-8'
//     ).toString('base64');

//     const response = await apiContext.post('/echo', {
//         headers: {
//             'x-payload-state': 'ENCRYPTED',
//             'x-data-encryption': 'JWS_AES_RSA',
//             'Content-Type': contentType,
//             'x-enc-wrapper-content-type': 'application/json',
//         },
//         data: {
//             encReqPayload: corruptedJWS,
//             encReqKey: encryptedRequest.encReqKey,
//             base64ivReq: encryptedRequest.base64ivReq,
//         },
//     });

//     expect(response.status()).toBe(400);
//     expect(response.headers()['content-type']).toContain('application/json');

//     const responseBody = await response.json();
//     // console.log(responseBody)

//     expect(responseBody).toEqual({
//         category: 'SERVER',
//         statusCode: 400,
//         errorCode: 'INVALID_JWS_SIGNATURE',
//         message: 'JWS signature verification failed',
//     });
// });