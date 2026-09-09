import { expect } from '@playwright/test';
import { test } from '../../../apiSetup/apiContext';

test('RTE_NEG_001_UnsupportedHTTPMethod', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'OPTIONS',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
    });

    expect(response.status()).toBe(405);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 405,
        errorCode: 'METHOD_NOT_ALLOWED',
        message: 'HTTP method not allowed',
    });
});

test('RTE_NEG_002_UnknownEndpoint', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echh', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 404,
        errorCode: 'SERVICE_NOT_FOUND',
        message: 'Endpoint not found',
    });
});

test('RTE_NEG_003_MissingPayloadStateHeader', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': '',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'MISSING_REQUIRED_HEADERS',
        message: 'Mandatory headers are missing',
    });
});

test('RTE_NEG_004_MissingDataEncryptionHeader', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': '',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'MISSING_REQUIRED_HEADERS',
        message: 'Mandatory headers are missing',
    });
});

test('RTE_NEG_005_MissingEncryptionWrapperContentTypeHeader', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': '',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'MISSING_REQUIRED_HEADERS',
        message: 'Mandatory headers are missing',
    });
});

test('RTE_NEG_006_InvalidPayloadStateValue', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': 'ABCD',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_HEADER_VALUE',
        message: 'Unsupported value passed in headers',
    });
});

test('RTE_NEG_007_InvalidDataEncryptionValue', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'ABCD',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_HEADER_VALUE',
        message: 'Unsupported value passed in headers',
    });
});

test('RTE_NEG_008_InvalidEncryptionWrapperContentTypeValue', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'NA',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'ABCD',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_HEADER_VALUE',
        message: 'Unsupported value passed in headers',
    });
});

test('RTE_NEG_009_InvalidFrameworkHeaderCombination', async ({ apiContext }) => {
    const response = await apiContext.fetch('/echo', {
        method: 'POST',
        headers: {
            'x-payload-state': 'PLAIN',
            'x-data-encryption': 'JWE',
            'Content-Type': 'application/json',
            'x-enc-wrapper-content-type': 'NA',
        },
        data: {
            name: 'Advait',
        },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain('application/json');

    const responseBody = await response.json();
    // console.log(responseBody)

    expect(responseBody).toEqual({
        category: 'SERVER',
        statusCode: 400,
        errorCode: 'INVALID_PAYLOAD_ENCRYPTION_COMBINATION',
        message: 'Payload state, data encryption and wrapper content type are not compatible',
    });
});