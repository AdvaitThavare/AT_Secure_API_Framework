import { bytesToString } from '../../../cryptography/commonCrypto/commonCryptoUtilities';

export type CryptoResponseSerializationResult = {
  payload: unknown;
  contentType: string;
};

export function cryptoResponseSerializer(
  decryptedPayload: ArrayBuffer
): CryptoResponseSerializationResult {

  const payload = bytesToString(decryptedPayload);

  try {
    return {
      payload: JSON.parse(payload),
      contentType: 'application/json',
    };
  } catch {
    return {
      payload,
      contentType: 'text/plain',
    };
  }
}