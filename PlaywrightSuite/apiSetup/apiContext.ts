import { request, test as base } from '@playwright/test';
import path from 'node:path';
import { serverConfig } from '../../src/serverManagement/serverConfig';

export async function createApiContext() {
  const certPath = path.resolve(
    process.cwd(),
    'certs/client/client.crt'
  );

  const keyPath = path.resolve(
    process.cwd(),
    'certs/client/client.key'
  );

  const baseURL = `https://${serverConfig.host}:${serverConfig.port}`;

  return await request.newContext({
    baseURL,
    clientCertificates: [
      {
        origin: baseURL,
        certPath,
        keyPath,
      },
    ],
    ignoreHTTPSErrors: true,
  });
}

export const test = base.extend<{
  apiContext: Awaited<ReturnType<typeof createApiContext>>;
}>({
  apiContext: async ({}, use) => {
    const apiContext = await createApiContext();

    await use(apiContext);

    await apiContext.dispose();
  },
});