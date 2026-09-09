import { expect } from '@playwright/test';
import { test } from '../../../apiSetup/apiContext';

test('PLN_NEG_001_MalformedJSON', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: '{"name":"Advait"',
  });

  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 400,
    errorCode: 'INVALID_REQUEST_PAYLOAD',
    message: 'Invalid request payload or incompatible content type',
  });
});

test('PLN_NEG_002_TopLevelJSONArray', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: ["a", "b"],
  });

  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();
  // console.log(responseBody)
  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 400,
    errorCode: 'INVALID_REQUEST_PAYLOAD',
    message: 'Invalid request payload or incompatible content type',
  });
});

test('PLN_NEG_003_TopLevelJSONNull', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: null,
  });

  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();
  // console.log(responseBody)
  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 400,
    errorCode: 'INVALID_REQUEST_PAYLOAD',
    message: 'Invalid request payload or incompatible content type',
  });
});

test('PLN_NEG_004_TopLevelJSONPrimitive', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: 1234,
  });

  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();
  // console.log(responseBody)
  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 400,
    errorCode: 'INVALID_REQUEST_PAYLOAD',
    message: 'Invalid request payload or incompatible content type',
  });
});

test('PLN_NEG_005_JSONContentTypeNonJSONBody', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: "Hello Arvind",
  });

  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();
  // console.log(responseBody)
  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 400,
    errorCode: 'INVALID_REQUEST_PAYLOAD',
    message: 'Invalid request payload or incompatible content type',
  });
});

test('PLN_NEG_006_UnsupportedContentType', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/xml',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: `<?xml version="1.0" encoding="UTF-8"?>
    <message>Hello, World!</message>`,
  });

  expect(response.status()).toBe(415);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();
  // console.log(responseBody)
  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 415,
    errorCode: 'UNSUPPORTED_CONTENT_TYPE',
    message: 'Unsupported Content-Type',
  });
});

test('PLN_NEG_007_EmptyJSONRequestBody', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: '',
  });

  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();
  // console.log(responseBody)
  expect(responseBody).toEqual({
    category: 'SERVER',
    statusCode: 400,
    errorCode: 'INVALID_REQUEST_PAYLOAD',
    message: 'Invalid request payload or incompatible content type',
  });
});