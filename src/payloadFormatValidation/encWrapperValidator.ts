import type { RequestContext } from '../context/requestContext';
import { decodeBase64, encodeBase64 } from '../cryptography/commonCrypto/commonCryptoUtilities';
import type { AppError } from '../errors/errorHandler';

const WRAPPER_REQUIREMENTS = {
    JWE: {
        payload: 'required',
        key: 'forbidden',
        iv: 'forbidden',
    },
    AES_RSA: {
        payload: 'required',
        key: 'required',
        iv: 'required',
    },
    JWS_AES_RSA: {
        payload: 'required',
        key: 'required',
        iv: 'required',
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
        iv?: unknown;
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

    if (requirements.key === 'forbidden') {

        if (wrapper.encReqKey !== undefined) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_ENC_REQ_KEY',
                message: 'encReqKey is not allowed',
            };
        }

    } else if (requirements.key === 'required') {

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

    if (requirements.iv === 'forbidden') {

        if (wrapper.iv !== undefined) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'iv is not allowed',
            };
        }

    } else if (requirements.iv === 'required') {

        if (
            typeof wrapper.iv !== 'string' ||
            !wrapper.iv
        ) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'MISSING_IV',
                message: 'iv is missing',
            };
        }

        // ===== IV Base64 Validation =====

        if (!ALLOWED_IV_BASE64_LENGTHS.has(wrapper.iv.length)) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV format',
            };
        }

        if (!isValidBase64(wrapper.iv)) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_IV',
                message: 'Invalid IV format',
            };
        }

        // ===== IV Decoded Length =====

        const decodedIv = decodeBase64(wrapper.iv);
            
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
        ...(wrapper.encReqKey !== undefined
            ? { key: wrapper.encReqKey as string }
            : {}),
        ...(wrapper.iv !== undefined
            ? { iv: wrapper.iv as string }
            : {}),
    };

    return null;
}