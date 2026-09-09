import { expect } from '@playwright/test';
import { test } from '../../../apiSetup/apiContext';

test('PLN_POS_001_SimpleJSONobject', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
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

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody.responsePayload).toEqual({
    name: 'Advait',
  });

  expect(responseBody.responseStatus).toEqual({
    success: true,
  });
});

test('PLN_POS_002_NestedJSONobject', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'application/json',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: {
      customer: {
        name: 'Advait',
        address: {
          city: 'Mumbai',
        },
      },
    },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const responseBody = await response.json();

  expect(responseBody.responsePayload).toEqual({
    customer: {
      name: 'Sunita',
      address: {
        city: 'Mumbai',
      },
    },
  });

  expect(responseBody.responseStatus).toEqual({
    success: true,
  });
});

test('PLN_POS_003_PlainText', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'text/plain',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: 'Roshan',
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');

  const responseBody = await response.text();

  expect(responseBody).toEqual('success:true\nresponsePayload:Roshan');
});

test('PLN_POS_004_PlainTextJSONLikeContent', async ({ apiContext }) => {
  const response = await apiContext.post('/echo', {
    headers: {
      'x-payload-state': 'PLAIN',
      'x-data-encryption': 'NA',
      'Content-Type': 'text/plain',
      'x-enc-wrapper-content-type': 'NA',
    },
    data: {
      name: 'Ghade'
    },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');

  const responseBody = await response.text();

  expect(responseBody).toEqual('success:true\nresponsePayload:{"name":"Ghade"}');
});