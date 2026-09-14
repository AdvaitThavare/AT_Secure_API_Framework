import { bytesToString } from '../../../cryptography/commonCrypto/commonCryptoUtilities';

export type clientCryptoResponseSerializationResult = {
  payload: unknown;
  contentType: string;
};

function isFrameworkResponse(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'responseStatus' in payload &&
    'responsePayload' in payload &&
    'responseContentType' in payload
  );
}

export function clientCryptoResponseSerializer(
  decryptedPayload: ArrayBuffer
): clientCryptoResponseSerializationResult {

  const payload = bytesToString(decryptedPayload);

  try {
    const parsedPayload = JSON.parse(payload);


    if (isFrameworkResponse(parsedPayload)) {
      return {
        payload: parsedPayload.responsePayload,
        contentType: parsedPayload.responseContentType,
      };
    }

    return {
      payload: parsedPayload,
      contentType: 'application/json',
    };


  } catch {
    return {
      payload,
      contentType: 'text/plain',
    };
  }
}
