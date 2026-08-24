import https from 'node:https';
import type { RequestListener } from 'node:http';
import { serverConfig } from './serverConfig';
import { getTLSConfig } from './tlsConfig';

export function createHTTPSServer(
  requestListener: RequestListener
): https.Server {
  return https.createServer(
    getTLSConfig(),
    requestListener
  );
}

export function startHTTPSServer(
  server: https.Server
): void {
  server.listen(
    serverConfig.port,
    serverConfig.host,
    () => {
      console.log(
        `mTLS Echo Server running at https://${serverConfig.host}:${serverConfig.port}`
      );
    }
  );
}