import { expect } from '@playwright/test';
import { test } from '../../../apiSetup/apiContext';

test('PLN_POS_001_SimpleJSONobject', async ({ apiContext }) => {
  const payload = {
    customerId: 'CUST001',
    name: 'Advait',
    amount: 1000,
  };

  const contentType = 'application/json'
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': contentType,
      'x-enc-wrapper-content-type': 'NA',
      'x-at-client-id': 'AT-CLIENT-001',
      'x-at-client-secret': 'AT-SECRET-001'
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody.responsePayload).toEqual(payload);
  expect(responseBody.responseContentType).toEqual(contentType)
  expect(responseBody.responseStatus).toEqual({
    "success": true,
  });
});

test('PLN_POS_002_NestedJSONobject', async ({ apiContext }) => {
  const payload = {
    customer: {
      name: 'Advait',
      address: {
        city: 'Mumbai',
      },
    },
  };

  const contentType = 'application/json'
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': contentType,
      'x-enc-wrapper-content-type': 'NA',
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody.responsePayload).toEqual(payload);
  expect(responseBody.responseContentType).toEqual(contentType)
  expect(responseBody.responseStatus).toEqual({
    "success": true,
  });
});

test('PLN_POS_003_PlainText', async ({ apiContext }) => {
  const payload = 'Roshan';

  const contentType = 'text/plain'
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': contentType,
      'x-enc-wrapper-content-type': 'NA',
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody.responsePayload).toEqual(payload);
  expect(responseBody.responseContentType).toEqual(contentType)
  expect(responseBody.responseStatus).toEqual({
    "success": true,
  });
});

test('PLN_POS_004_PlainTextJSONLikeContent', async ({ apiContext }) => {
  const payload = {
    customerId: 'CUST002',
    name: 'Sunita',
    amount: 1500,
  };

  const contentType = 'text/plain'
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': contentType,
      'x-enc-wrapper-content-type': 'NA',
    },
    data: payload,
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody.responsePayload).toEqual(JSON.stringify(payload));
  expect(responseBody.responseContentType).toEqual(contentType)
  expect(responseBody.responseStatus).toEqual({
    "success": true,
  });
});