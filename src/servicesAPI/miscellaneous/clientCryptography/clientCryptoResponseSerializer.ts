import { bytesToString } from '../../../cryptography/commonCrypto/commonCryptoUtilities';

export type clientCryptoResponseSerializationResult = {
  payload: unknown;
  contentType: string;
};

export function clientCryptoResponseSerializer(
  decryptedPayload: ArrayBuffer
): clientCryptoResponseSerializationResult {

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