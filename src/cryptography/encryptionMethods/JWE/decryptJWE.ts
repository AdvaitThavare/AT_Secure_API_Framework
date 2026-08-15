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
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { bytesToString, decodeBase64Url, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';

const { serverPrivateKey } = getCryptoFunctionKeys();

export async function decryptJWE(
  context: RequestContext
): Promise<AppError | null> {
  const wrapper = context.encryptedWrapper;

  // ===== Split JWE =====

  const parts = wrapper!.payload.split('.');

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
        key: serverPrivateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      decodeBase64Url(encryptedKey)
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

  const ivBytes = decodeBase64Url(iv);

  const cipherBytes = decodeBase64Url(cipherText);

  const tagBytes = decodeBase64Url(authenticationTag);

  const encryptedPayload = Buffer.concat([
    cipherBytes,
    tagBytes,
  ]);

  const aad = stringToBytes(protectedHeader);

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
          iv: ivBytes,
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
      bytesToString(
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