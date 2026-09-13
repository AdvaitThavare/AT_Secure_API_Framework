import { test } from '../apiContext';
import fs from 'node:fs';
import path from 'node:path';
import { decryptClientJWE, encryptClientJWE } from './helper-clientJWE';
import { decryptClientAESRSA, encryptClientAESRSA } from './helper-clientAESRSA';
import { decryptClientJWSAESRSA, encryptClientJWSAESRSA } from './helper-clientJWSAESRSA';

const transitPayloadPath = path.resolve(
    process.cwd(),
    'PlaywrightSuite/apiSetup/clientCryptoHelper/transitPayloadTemp'
);

test('CC_TOOL_001_JWE_Encrypt', async ({ apiContext }) => {
    const payload = {
        customerId: 'CUST001',
        name: 'Advait',
        amount: 1000,
    };

    const encryptedResponse = await encryptClientJWE(
        apiContext,
        payload,
        'application/json'
    );

    fs.writeFileSync(
        transitPayloadPath,
        JSON.stringify({
            encReqPayload: encryptedResponse.encReqPayload,
        }, null, 4)
    );

    console.log('\n===== JWE Encryption Result =====');
    console.log(encryptedResponse.encReqPayload);
});

test('TOOL_Echo_JWE', async ({ apiContext }) => {
    const transitPayload = JSON.parse(
        fs.readFileSync(transitPayloadPath, 'utf-8')
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWE',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: transitPayload.encReqPayload,
        },
    });

    const responseBody = await response.json();

    fs.writeFileSync(
        transitPayloadPath,
        JSON.stringify({
            ...transitPayload,
            encResPayload: responseBody.encResPayload,
        }, null, 4)
    );

    console.log('\n===== Echo JWE Response =====');
    console.log(responseBody.encResPayload);
});

test('CC_TOOL_002_JWE_Decrypt', async ({ apiContext }) => {
    const transitPayload = JSON.parse(
        fs.readFileSync(transitPayloadPath, 'utf-8')
    );

    const decryptedResponse = await decryptClientJWE(
        apiContext,
        transitPayload.encResPayload,
        'application/json'
    );

    console.log('\n===== JWE Decryption Result =====');
    console.log(decryptedResponse);
});

test('CC_TOOL_003_AESRSA_Encrypt', async ({ apiContext }) => {
    const payload = {
        customerId: 'CUST001',
        name: 'Advait',
        amount: 1000,
    };

    const encryptedResponse = await encryptClientAESRSA(
        apiContext,
        payload,
        'application/json'
    );

    fs.writeFileSync(
        transitPayloadPath,
        JSON.stringify({
            encReqPayload: encryptedResponse.encReqPayload,
            encReqKey: encryptedResponse.encReqKey,
            base64ivReq: encryptedResponse.base64ivReq,
        }, null, 4)
    );

    console.log('\n===== AES_RSA Encryption Result =====');
    console.log(encryptedResponse);
});

test('TOOL_Echo_AESRSA', async ({ apiContext }) => {
    const transitPayload = JSON.parse(
        fs.readFileSync(transitPayloadPath, 'utf-8')
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'AES_RSA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: transitPayload.encReqPayload,
            encReqKey: transitPayload.encReqKey,
            base64ivReq: transitPayload.base64ivReq,
        },
    });

    const responseBody = await response.json();

    fs.writeFileSync(
        transitPayloadPath,
        JSON.stringify({
            ...transitPayload,
            encResPayload: responseBody.encResPayload,
            encResKey: responseBody.encResKey,
            base64ivRes: responseBody.base64ivRes,
        }, null, 4)
    );

    console.log('\n===== Echo AES_RSA Response =====');
    console.log(responseBody);
});

test('CC_TOOL_004_AESRSA_Decrypt', async ({ apiContext }) => {
    const transitPayload = JSON.parse(
        fs.readFileSync(transitPayloadPath, 'utf-8')
    );

    const decryptedResponse = await decryptClientAESRSA(
        apiContext,
        {
            encReqPayload: transitPayload.encResPayload,
            encReqKey: transitPayload.encResKey,
            base64ivReq: transitPayload.base64ivRes,
        },
        'application/json'
    );

    console.log('\n===== AES_RSA Decryption Result =====');
    console.log(decryptedResponse);
});

test('CC_TOOL_005_JWSAESRSA_Encrypt', async ({ apiContext }) => {
    const payload = {
        customerId: 'CUST001',
        name: 'Advait',
        amount: 1000,
    };

    const encryptedResponse = await encryptClientJWSAESRSA(
        apiContext,
        payload,
        'application/json'
    );

    fs.writeFileSync(
        transitPayloadPath,
        JSON.stringify({
            encReqPayload: encryptedResponse.encReqPayload,
            encReqKey: encryptedResponse.encReqKey,
            base64ivReq: encryptedResponse.base64ivReq,
        }, null, 4)
    );

    console.log('\n===== JWS_AES_RSA Encryption Result =====');
    console.log(encryptedResponse);
});

test('TOOL_Echo_JWSAESRSA', async ({ apiContext }) => {
    const transitPayload = JSON.parse(
        fs.readFileSync(transitPayloadPath, 'utf-8')
    );

    const response = await apiContext.post('/echo', {
        headers: {
            'x-payload-state': 'ENCRYPTED',
            'x-data-encryption': 'JWS_AES_RSA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'application/json',
        },
        data: {
            encReqPayload: transitPayload.encReqPayload,
            encReqKey: transitPayload.encReqKey,
            base64ivReq: transitPayload.base64ivReq,
        },
    });

    const responseBody = await response.json();

    fs.writeFileSync(
        transitPayloadPath,
        JSON.stringify({
            ...transitPayload,
            encResPayload: responseBody.encResPayload,
            encResKey: responseBody.encResKey,
            base64ivRes: responseBody.base64ivRes,
        }, null, 4)
    );

    console.log('\n===== Echo JWS_AES_RSA Response =====');
    console.log(responseBody);
});

test('CC_TOOL_006_JWSAESRSA_Decrypt', async ({ apiContext }) => {
    const transitPayload = JSON.parse(
        fs.readFileSync(transitPayloadPath, 'utf-8')
    );

    const decryptedResponse = await decryptClientJWSAESRSA(
        apiContext,
        {
            encReqPayload: transitPayload.encResPayload,
            encReqKey: transitPayload.encResKey,
            base64ivReq: transitPayload.base64ivRes,
        },
        'application/json'
    );

    console.log('\n===== JWS_AES_RSA Decryption Result =====');
    console.log(decryptedResponse);
});