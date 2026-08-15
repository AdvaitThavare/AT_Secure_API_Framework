import fs from 'node:fs';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';

const CERTS_DIR = path.resolve(process.cwd(), 'certs');

const SERVER_KEY_PATH = path.join(CERTS_DIR, 'server', 'server.key');
const CLIENT_CERT_PATH = path.join(CERTS_DIR, 'client', 'client.crt');

export function getCryptoFunctionKeys() {
    const serverPrivateKey = fs.readFileSync(SERVER_KEY_PATH, 'utf8');
    const clientCertificate = fs.readFileSync(CLIENT_CERT_PATH, 'utf8');

    const clientPublicKey = new X509Certificate(clientCertificate)
        .publicKey
        .export({
            type: 'spki',
            format: 'pem',
        }) as string;

    return {
        serverPrivateKey,
        clientPublicKey,
    };
}