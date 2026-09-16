import type { RequestContext } from '../context/requestContext';
import { decodeBase64, encodeBase64 } from '../cryptography/commonCrypto/commonCryptoUtilities';
import type { AppError } from '../errors/errorHandler';

const WRAPPER_REQUIREMENTS = {
    JWE: {
        payload: 'required',
        key: 'optional',
        base64iv: 'optional',
    },
    AES_RSA: {
        payload: 'required',
        key: 'required',
        base64iv: 'required',
    },
    JWS_AES_RSA: {
        payload: 'required',
        key: 'required',
        base64iv: 'required',
    },
} as const;

function isValidBase64(value: string): boolean {
    try {
        const decoded = decodeBase64(value);

        return (
            decoded.length > 0 &&
            encodeBase64(decoded) === value
        );
    } catch {
        return false;
    }
}

export function encWrapperValidator(
    context: RequestContext
): AppError | null {

    let wrapper: {
        encReqPayload?: unknown;
        encReqKey?: unknown;
        base64ivReq?: unknown;
    };

    try {
        wrapper = JSON.parse(context.requestRawBody);
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_WRAPPER',
            message: 'Invalid encrypted payload wrapper',
        };
    }

    if (
        typeof wrapper !== 'object' ||
        wrapper === null ||
        Array.isArray(wrapper)
    ) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_WRAPPER',
            message: 'Invalid encrypted payload wrapper',
        };
    }

    const encryptionType = context.encryptionType;

    if (!encryptionType || encryptionType === 'NA') {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTION_TYPE',
            message: 'Unsupported encryption type',
        };
    }

    const requirements =
        WRAPPER_REQUIREMENTS[encryptionType];

    if (!requirements) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTION_TYPE',
            message: 'Unsupported encryption type',
        };
    }

    // ===== Required Payload =====

    if (
        requirements.payload === 'required' &&
        (
            typeof wrapper.encReqPayload !== 'string' ||
            !wrapper.encReqPayload
        )
    ) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'MISSING_ENC_REQ_PAYLOAD',
            message: 'encReqPayload is missing',
        };
    }

    // ===== Encryption Key =====

    if (requirements.key === 'required') {

        if (
            typeof wrapper.encReqKey !== 'string' ||
            !wrapper.encReqKey
        ) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'MISSING_ENC_REQ_KEY',
                message: 'encReqKey is missing',
            };
        }
    }

    // ===== IV =====

    if (requirements.base64iv === 'required') {

        if (
            typeof wrapper.base64ivReq !== 'string' ||
            !wrapper.base64ivReq
        ) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'MISSING_IV',
                message: 'base64ivReq is missing',
            };
        }

        // ===== IV Base64 Validation =====

        if (wrapper.base64ivReq.length !== 24) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV length. Expected a 16-byte IV encoded as 24 characters Base64 String',
            };
        }

        const decodedIv = decodeBase64(wrapper.base64ivReq);

        if (encodeBase64(decodedIv) !== wrapper.base64ivReq) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV format. Expected a standard Base64-encoded string',
            };
        }
    }

    // ===== Normalize Wrapper =====

    context.encryptedWrapper = {
        payload: wrapper.encReqPayload as string,
        ...(typeof wrapper.encReqKey === 'string'
            ? { key: wrapper.encReqKey }
            : {}),
        ...(typeof wrapper.base64ivReq === 'string'
            ? { base64iv: wrapper.base64ivReq }
            : {}),
    };

    return null;
}