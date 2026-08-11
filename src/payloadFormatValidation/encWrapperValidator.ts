import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';

export function encWrapperValidator(
    context: RequestContext
): AppError | null {

    let wrapper: {
        encReqPayload?: string;
        encReqKey?: string;
    };

    try {
        wrapper = JSON.parse(context.rawBody);
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_WRAPPER',
            message: 'Invalid encrypted payload wrapper',
        };
    }

    // ===== Required Payload =====

    if (typeof wrapper.encReqPayload !== 'string' || !wrapper.encReqPayload) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'MISSING_ENC_REQ_PAYLOAD',
            message: 'encReqPayload is missing',
        };
    }

    // ===== Validate Encryption-Specific Key =====

    if (context.encryptionType === 'JWE') {

        if (wrapper.encReqKey !== undefined) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'INVALID_ENC_REQ_KEY',
                message: 'encReqKey is not allowed for JWE',
            };
        }

    } else {

        if (typeof wrapper.encReqKey !== 'string' || !wrapper.encReqKey) {
            return {
                category: 'SERVER',
                statusCode: 400,
                errorCode: 'MISSING_ENC_REQ_KEY',
                message: 'encReqKey is missing',
            };
        }
    }

    // ===== Normalize Wrapper =====

    context.encryptedWrapper = {
        payload: wrapper.encReqPayload,
        ...(wrapper.encReqKey !== undefined
            ? { key: wrapper.encReqKey }
            : {}),
    };

    return null;
}