import fs from 'node:fs';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';

const CERTS_DIR = path.resolve(process.cwd(), 'certs');

const SERVER_CERT_PATH = path.join(CERTS_DIR, 'server', 'server.crt');
const CLIENT_KEY_PATH = path.join(CERTS_DIR, 'client', 'client.key');

export function getClientCryptoConfig() {
  const serverCertificate = fs.readFileSync(SERVER_CERT_PATH, 'utf8');
  const clientPrivateKey = fs.readFileSync(CLIENT_KEY_PATH, 'utf8');

  const serverPublicKey = new X509Certificate(serverCertificate)
    .publicKey
    .export({
      type: 'spki',
      format: 'pem',
    }) as string;

  return {
    serverPublicKey,
    clientPrivateKey,
  };
}