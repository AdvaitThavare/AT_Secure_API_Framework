import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { PAYLOAD_STATES, DATA_ENCRYPTIONS, type PayloadState, type DataEncryption, ENC_WRAPPER_CONTENT_TYPES, type EncWrapperContentType } from '../constants/payloadIdentifierConstants';
import { HEADER_PAYLOAD_STATE, HEADER_DATA_ENCRYPTION, HEADER_ENC_WRAPPER_CONTENT_TYPE } from '../constants/headerConstants';

type ValidCombination = {
  dataEncryption: DataEncryption;
  wrapperContentType: EncWrapperContentType;
};

const VALID_COMBINATIONS: Map<
  PayloadState,
  ValidCombination[]
> = new Map([
  [
    'PLAIN',
    [
      {
        dataEncryption: 'NA',
        wrapperContentType: 'NA',
      },
    ],
  ],
  [
    'ENCRYPTED',
    [
      {
        dataEncryption: 'JWE',
        wrapperContentType: 'application/json',
      },
      {
        dataEncryption: 'JWS_AES_RSA',
        wrapperContentType: 'application/json',
      },
      {
        dataEncryption: 'AES_RSA',
        wrapperContentType: 'application/json',
      },
    ],
  ],
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

function isEncWrapperContentType(
  value: string
): value is EncWrapperContentType {
  return ENC_WRAPPER_CONTENT_TYPES.includes(
    value as EncWrapperContentType
  );
}

export function payloadTypeIdentifier(
  context: RequestContext
): AppError | null {

  const payloadStateValues =
    context.requestHeaders[HEADER_PAYLOAD_STATE];

  const dataEncryptionValues =
    context.requestHeaders[HEADER_DATA_ENCRYPTION];

  const encWrapperContentTypeValues =
    context.requestHeaders[HEADER_ENC_WRAPPER_CONTENT_TYPE];

  // ===== Multiple Header Values Check =====

  if (
    payloadStateValues?.length > 1 ||
    dataEncryptionValues?.length > 1 ||
    encWrapperContentTypeValues?.length > 1
  ) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MULTIPLE_HEADER_VALUES',
      message: 'Multiple values for the same header are not allowed',
    };
  }

  // ===== Required Headers =====

  const payloadState = payloadStateValues?.[0];
  const dataEncryption = dataEncryptionValues?.[0];
  const encWrapperContentType = encWrapperContentTypeValues?.[0];

  if (
    !payloadState ||
    !dataEncryption ||
    !encWrapperContentType
  ) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'MISSING_REQUIRED_HEADERS',
      message: 'Mandatory headers are missing',
    };
  }

  // ===== Supported Values =====

  if (
    !isPayloadState(payloadState) ||
    !isDataEncryption(dataEncryption) ||
    !isEncWrapperContentType(encWrapperContentType)
  ) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_HEADER_VALUE',
      message: 'Unsupported value passed in headers',
    };
  }

  // ===== Valid Combination =====

  const allowedCombinations = VALID_COMBINATIONS.get(payloadState);

  const isValidCombination =
    allowedCombinations?.some(
      (combination) =>
        combination.dataEncryption === dataEncryption &&
        combination.wrapperContentType === encWrapperContentType
    );

  if (!isValidCombination) {
    return {
      category: 'SERVER',
      statusCode: 400,
      errorCode: 'INVALID_PAYLOAD_ENCRYPTION_COMBINATION',
      message: 'Payload state, data encryption and wrapper content type are not compatible',
    };
  }

  // ===== Populate Context =====

  context.payloadType = payloadState;
  context.encryptionType = dataEncryption;

  return null;
}