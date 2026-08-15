import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { PAYLOAD_STATES, DATA_ENCRYPTIONS, type PayloadState, type DataEncryption } from '../constants/cryptographyConstants';
import { HEADER_PAYLOAD_STATE, HEADER_DATA_ENCRYPTION } from '../constants/headerConstants';

const VALID_COMBINATIONS: Map<
  PayloadState,
  Set<DataEncryption>
> = new Map([
  ['PLAIN', new Set<DataEncryption>(['NA'])],
  ['ENCRYPTED', new Set([
    'JWE',
    'JWS_AES_RSA',
    'AES_RSA',
  ])],
]);

function isPayloadState(
  value: string
): value is PayloadState {
  return PAYLOAD_STATES.includes(value as PayloadState);
}

function isDataEncryption(
  value: string
): value is DataEncryption {
  return DATA_ENCRYPTIONS.includes(value as DataEncryption);
}

export function payloadTypeIdentifier(
  context: RequestContext
): AppError | null {

  const payloadStateValues =
    context.requestHeaders[HEADER_PAYLOAD_STATE];

  const dataEncryptionValues =
    context.requestHeaders[HEADER_DATA_ENCRYPTION];

  if (payloadStateValues?.length > 1) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MULTIPLE_PAYLOAD_STATE',
      message: 'Multiple payload state headers are not allowed',
    };
  }

  if (dataEncryptionValues?.length > 1) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MULTIPLE_DATA_ENCRYPTION',
      message: 'Multiple data encryption headers are not allowed',
    };
  }

  // ===== Required Headers =====

  const payloadState = payloadStateValues?.[0];
  const dataEncryption = dataEncryptionValues?.[0];


  if (!payloadState) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MISSING_PAYLOAD_STATE',
      message: 'Missing x-payload-state header',
    };
  }

  if (!dataEncryption) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MISSING_DATA_ENCRYPTION',
      message: 'Missing x-data-encryption header',
    };
  }

  // ===== Supported Values =====

  if (!isPayloadState(payloadState)) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_PAYLOAD_STATE',
      message: 'Unsupported payload state',
    };
  }

  if (!isDataEncryption(dataEncryption)) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_DATA_ENCRYPTION',
      message: 'Unsupported data encryption',
    };
  }

  // ===== Valid Combination =====

  const allowedEncryptions =
    VALID_COMBINATIONS.get(payloadState);

  if (!allowedEncryptions?.has(dataEncryption)) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_PAYLOAD_ENCRYPTION_COMBINATION',
      message: 'Payload state and data encryption are not compatible',
    };
  }

  // ===== Populate Context =====

  context.payloadType = payloadState;
  context.encryptionType = dataEncryption;

  return null;
}