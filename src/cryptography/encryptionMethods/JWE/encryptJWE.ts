/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * Signature       : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { encodeBase64Url, generateRandomBytes, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';
import { encryptAES_GCM } from '../../cryptoAlgorithms/AES_Utility/AES_GCM';
import { encryptRSA } from '../../cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import type { CryptoExecutionContext } from '../../CryptoExecutionContext';
import type { EncryptPayloadResult } from '../../cryptographyLayer';


const { clientPublicKey } = getCryptoFunctionKeys();

export type JWEResponse = {
  encResPayload: string;
};

export async function encryptJWE(
  context: RequestContext,
  cryptoExecutionContext: CryptoExecutionContext,
  responseBody: string
): Promise<EncryptPayloadResult> {

  // ===== Protected Header =====

  const protectedHeader = encodeBase64Url(
    stringToBytes(
      JSON.stringify({
        alg: cryptoExecutionContext.protocol?.alg,
        enc: cryptoExecutionContext.protocol?.enc,
        typ: cryptoExecutionContext.protocol?.typ,
      })
    )
  );

  // ===== Generate CEK =====

  const cek = generateRandomBytes(cryptoExecutionContext.aes!.keyLength! / 8);

  // ===== Generate IV =====

  const iv = generateRandomBytes(cryptoExecutionContext.aes!.ivLength!);

  // ===== AES-GCM Encryption =====

  let encryptedBuffer: ArrayBuffer;

  try {
    encryptedBuffer = await encryptAES_GCM(
      cek,
      iv,
      stringToBytes(responseBody),
      stringToBytes(protectedHeader),
      cryptoExecutionContext.aes!.tagLength!
    );
  } catch {
    return {
      error: {
        category: 'SERVER',
        statusCode: 500,
        errorCode: 'JWE_ENCRYPTION_FAILED',
        message: 'Failed to encrypt response payload',
      },
      responseBody: '',
    };
  }

  // ===== Split Ciphertext and Authentication Tag =====

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  const tagLengthBytes =
    cryptoExecutionContext.aes!.tagLength! / 8;

  const cipherText = encryptedBytes.slice(
    0,
    encryptedBytes.length - tagLengthBytes
  );

  const authenticationTag = encryptedBytes.slice(
    encryptedBytes.length - tagLengthBytes
  );

  // ===== RSA Encryption =====

  let encryptedKey: Buffer;

  try {
    encryptedKey = encryptRSA(
      clientPublicKey,
      cek,
      cryptoExecutionContext.rsa!.padding!,
      cryptoExecutionContext.rsa!.oaepHash!
    );
  } catch {
    return {
      error: {
        category: 'SERVER',
        statusCode: 500,
        errorCode: 'JWE_KEY_ENCRYPTION_FAILED',
        message: 'Failed to encrypt content encryption key',
      },
      responseBody: '',
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

  return {
    error: null,
    responseBody: JSON.stringify({
      encResPayload: compactJWE,
    } satisfies JWEResponse),
  };
}