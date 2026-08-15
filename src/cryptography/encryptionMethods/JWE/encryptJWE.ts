/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * Signature       : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { constants, publicEncrypt, webcrypto } from 'node:crypto';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { encodeBase64Url, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';


const { clientPublicKey } = getCryptoFunctionKeys();

export type JWEResponse = {
  encResPayload: string;
};

export async function encryptJWE(
  context: RequestContext
): Promise<AppError | null> {

  // ===== Protected Header =====

  const protectedHeader = encodeBase64Url(
    stringToBytes(
      JSON.stringify({
        alg: 'RSA-OAEP-256',
        enc: 'A256GCM',
        typ: 'JWE',
      })
    )
  );

  // ===== Generate CEK =====

  const cek = generateRandomBytes(32);

  // ===== Generate IV =====

  const iv = generateRandomBytes(12);

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
        additionalData: stringToBytes(protectedHeader),
        tagLength: 128,
      },
      aesKey,
      stringToBytes(plaintext)
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
        key: clientPublicKey,
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
    encodeBase64Url(encryptedKey),
    encodeBase64Url(iv),
    encodeBase64Url(cipherText),
    encodeBase64Url(authenticationTag),
  ].join('.');

  // ===== Final Output =====

  context.serviceResponse = {
    encResPayload: compactJWE,
  } satisfies JWEResponse;

  return null;
}