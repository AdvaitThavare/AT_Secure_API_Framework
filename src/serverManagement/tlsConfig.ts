import fs from 'node:fs';
import path from 'node:path';

const CERTS_DIR = path.resolve(process.cwd(), 'certs');

const SERVER_KEY_PATH = path.join(CERTS_DIR, 'server', 'server.key');
const SERVER_CERT_PATH = path.join(CERTS_DIR, 'server', 'server.crt');
const CA_CERT_PATH = path.join(CERTS_DIR, 'ca', 'ca.crt');

export function getTLSConfig() {
    return {
        key: fs.readFileSync(SERVER_KEY_PATH),
        cert: fs.readFileSync(SERVER_CERT_PATH),
        ca: fs.readFileSync(CA_CERT_PATH),
        requestCert: true, // Require the client to present a certificate
        rejectUnauthorized: true, // Reject clients whose certificate is not trusted
    };
}