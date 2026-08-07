/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * Signature       : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { privateDecrypt, constants, webcrypto, } from 'node:crypto';
import fs from 'node:fs';
import { serverConfig } from '../../../config/serverConfig';

const privateKey = fs.readFileSync(
  serverConfig.certificates.key,
  'utf8'
);

type JWERequest = {
  encPayload: string;
};

export async function decryptJWE(
  context: RequestContext
): Promise<AppError | null> {
  const wrapper = context.payload as JWERequest;

  // ===== Split JWE =====

  const parts = wrapper.encPayload.split('.');

  if (parts.length !== 5) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_JWE',
      message: 'Invalid JWE format',
    };
  }

  const [
    protectedHeader,
    encryptedKey,
    iv,
    cipherText,
    authenticationTag,
  ] = parts;

  // ===== RSA Decryption =====

  let cek: Buffer;

  try {
    cek = privateDecrypt(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedKey, 'base64url')
    );
  } catch {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_ENCRYPTED_KEY',
      message: 'Failed to decrypt content encryption key',
    };
  }

  // ===== Convert to Buffers =====

  const ivBuffer = Buffer.from(iv, 'base64url');

  const cipherBuffer = Buffer.from(
    cipherText,
    'base64url'
  );

  const tagBuffer = Buffer.from(
    authenticationTag,
    'base64url'
  );

  const encryptedPayload = Buffer.concat([
    cipherBuffer,
    tagBuffer,
  ]);

  const aad = new TextEncoder().encode(
    protectedHeader
  );

  // ===== AES-GCM Decryption =====

  let decryptedBuffer: ArrayBuffer;

  try {

    const aesKey =
      await webcrypto.subtle.importKey(
        'raw',
        new Uint8Array(cek),
        {
          name: 'AES-GCM',
        },
        false,
        ['decrypt']
      );

    decryptedBuffer =
      await webcrypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          additionalData: aad,
          tagLength: 128,
        },
        aesKey,
        encryptedPayload
      );

  } catch {

    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_JWE_PAYLOAD',
      message: 'Failed to decrypt JWE payload',
    };

  }

  // ===== Final Output =====

  try {
    const decryptedString =
      new TextDecoder().decode(
        decryptedBuffer
      );

    context.payload = JSON.parse(
      decryptedString
    );

    return null;

  } catch {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_DECRYPTED_PAYLOAD',
      message: 'Decrypted payload is not valid JSON',
    };
  }
}