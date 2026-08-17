/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * Signature       : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { constants, } from 'node:crypto';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { bytesToString, decodeBase64Url, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { decryptAES_GCM } from '../../cryptoAlgorithms/AES_Utility/AES_GCM';
import { decryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';

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
    cek = decryptRSA(
      serverPrivateKey,
      decodeBase64Url(encryptedKey),
      constants.RSA_PKCS1_OAEP_PADDING,
      'sha256'
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
    decryptedBuffer = await decryptAES_GCM(
      new Uint8Array(cek),
      ivBytes,
      encryptedPayload,
      aad,
      128
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