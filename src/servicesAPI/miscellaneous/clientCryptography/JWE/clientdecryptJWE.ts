 /**
  * Encryption Type : JWE
  * Standard        : JOSE
  * Content Cipher  : AES-256-GCM
  * Key Decryption  : RSA-OAEP-256
  * RSA Padding     : OAEP
  * OAEP Hash       : SHA-256
  * IV              : 12 bytes
  * Auth Tag        : 128 bits
  * Signature       : None
  */

import { constants } from 'node:crypto';
import { decryptAES_GCM } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_GCM';
import { decryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { bytesToString, decodeBase64Url, stringToBytes } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { getClientCryptoConfig } from '../clientCryptoConfig';
import { clientCryptoResponseSerializer } from '../clientCryptoResponseSerializer';

const { clientPrivateKey } = getClientCryptoConfig();

type ClientJWEDecryptRequest = {
  encResPayload: string;
  encResKey?: string;
  base64iv?: string;
};

export async function clientdecryptJWE(
  context: ServiceContext
): Promise<ServiceResponse> {

  const { encResPayload } =
    context.payload as ClientJWEDecryptRequest;

  if (typeof encResPayload !== 'string') {
    return {
      statusCode: 400,
      payload: {
        errorCode: 'INVALID_JWE_REQUEST',
        message: 'encResPayload must be a string',
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  const parts = encResPayload.split('.');

  if (parts.length !== 5) {
    return {
      statusCode: 400,
      payload: {
        errorCode: 'INVALID_JWE',
        message: 'Invalid JWE format',
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  const [
    protectedHeader,
    encryptedKey,
    iv,
    cipherText,
    authenticationTag,
  ] = parts;

  let header: {
    alg?: string;
    enc?: string;
    typ?: string;
  };

  try {
    header = JSON.parse(
      bytesToString(
        decodeBase64Url(protectedHeader)
      )
    );
  } catch {
    return {
      statusCode: 400,
      payload: {
        errorCode: 'INVALID_JWE',
        message: 'Invalid JWE protected header',
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  if (
    header.alg !== 'RSA-OAEP-256' ||
    header.enc !== 'A256GCM' ||
    header.typ !== 'JWE'
  ) {
    return {
      statusCode: 400,
      payload: {
        errorCode: 'UNSUPPORTED_JWE_CONFIGURATION',
        message: 'Unsupported JWE configuration',
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  let cek: Buffer;

  try {
    cek = decryptRSA(
      clientPrivateKey,
      decodeBase64Url(encryptedKey),
      constants.RSA_PKCS1_OAEP_PADDING,
      'sha256'
    );
  } catch {
    return {
      statusCode: 400,
      payload: {
        errorCode: 'INVALID_ENCRYPTED_KEY',
        message: 'Failed to decrypt content encryption key',
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  const ivBytes = decodeBase64Url(iv);
  const cipherBytes = decodeBase64Url(cipherText);
  const tagBytes = decodeBase64Url(authenticationTag);

  const encryptedPayload = Buffer.concat([
    cipherBytes,
    tagBytes,
  ]);

  let decryptedBuffer: ArrayBuffer;

  try {
    decryptedBuffer = await decryptAES_GCM(
      new Uint8Array(cek),
      ivBytes,
      encryptedPayload,
      stringToBytes(protectedHeader),
      128
    );
  } catch {
    return {
      statusCode: 400,
      payload: {
        errorCode: 'INVALID_JWE_PAYLOAD',
        message: 'Failed to decrypt JWE payload',
      },
      responseHeaders: {
        'content-type': ['application/json'],
      },
    };
  }

  const serializedResponse = clientCryptoResponseSerializer(decryptedBuffer);

  return {
    statusCode: 200,
    payload: serializedResponse.payload,
    responseHeaders: {
      'content-type': [serializedResponse.contentType],
    },
  };
}