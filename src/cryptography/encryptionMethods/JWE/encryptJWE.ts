/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * Signature       : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { constants, publicEncrypt, randomBytes, webcrypto } from 'node:crypto';
import fs from 'node:fs';
import { serverConfig } from '../../../config/serverConfig';

const publicKey = fs.readFileSync(
  serverConfig.certificates.clientCert,
  'utf8'
);

export type JWEResponse = {
  encResPayload: string;
};

export async function encryptJWE(
  context: RequestContext
): Promise<AppError | null> {

  // ===== Protected Header =====

  const protectedHeader = Buffer.from(
    JSON.stringify({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
      typ: 'JWE',
    })
  ).toString('base64url');

  // ===== Generate CEK =====

  const cek = randomBytes(32);

  // ===== Generate IV =====

  const iv = randomBytes(12);

  // ===== Convert Payload to JSON =====

  let plaintext: string;

  try {
    plaintext = JSON.stringify(context.serviceResponse);
  } catch {
    return {
      category: 'SERVER',
      statusCode: 500,
      errorCode: 'INVALID_RESPONSE_PAYLOAD',
      message: 'Response payload could not be serialized to JSON',
    };
  }

  // ===== AES-GCM Encryption =====

  let encryptedBuffer: ArrayBuffer;

  try {
    const aesKey = await webcrypto.subtle.importKey(
      'raw',
      new Uint8Array(cek),
      {
        name: 'AES-GCM',
      },
      false,
      ['encrypt']
    );

    encryptedBuffer = await webcrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: new TextEncoder().encode(protectedHeader),
        tagLength: 128,
      },
      aesKey,
      new TextEncoder().encode(plaintext)
    );
  } catch {
    return {
      category: 'SERVER',
      statusCode: 500,
      errorCode: 'JWE_ENCRYPTION_FAILED',
      message: 'Failed to encrypt response payload',
    };
  }

  // ===== Split Ciphertext and Authentication Tag =====

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  const cipherText = encryptedBytes.slice(
    0,
    encryptedBytes.length - 16
  );

  const authenticationTag = encryptedBytes.slice(
    encryptedBytes.length - 16
  );

  // ===== RSA Encryption =====

  let encryptedKey: Buffer;

  try {
    encryptedKey = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      cek
    );
  } catch {
    return {
      category: 'SERVER',
      statusCode: 500,
      errorCode: 'JWE_KEY_ENCRYPTION_FAILED',
      message: 'Failed to encrypt content encryption key',
    };
  }

  // ===== Construct Compact JWE =====

  const compactJWE = [
    protectedHeader,
    encryptedKey.toString('base64url'),
    iv.toString('base64url'),
    Buffer.from(cipherText).toString('base64url'),
    Buffer.from(authenticationTag).toString('base64url'),
  ].join('.');

  // ===== Final Output =====

  context.serviceResponse = {
    encResPayload: compactJWE,
  } satisfies JWEResponse;

  return null;
}