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

const ALLOWED_IV_BASE64_LENGTHS = new Set([16, 24]);

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

        if (!ALLOWED_IV_BASE64_LENGTHS.has(wrapper.base64ivReq.length)) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV format',
            };
        }

        if (!isValidBase64(wrapper.base64ivReq)) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV format',
            };
        }

        // ===== IV Decoded Length =====

        const decodedIv = decodeBase64(wrapper.base64ivReq);

        if (
            decodedIv.length !== 12 &&
            decodedIv.length !== 16
        ) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV length',
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