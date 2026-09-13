/**
 * Encryption Type : JWE
 * Standard        : JOSE
 * Content Cipher  : AES-256-GCM
 * Key Encryption  : RSA-OAEP-256
 * RSA Padding     : OAEP
 * OAEP Hash       : SHA-256
 * IV              : 12 bytes
 * Auth Tag        : 128 bits
 * Signature       : None
 */

import { constants } from 'node:crypto';
import { encryptAES_GCM } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_GCM';
import { encryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { encodeBase64Url, generateRandomBytes, stringToBytes } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { clientCryptoRequestSerializer } from '../clientCryptoRequestSerializer';
import { getClientCryptoConfig } from '../clientCryptoConfig';

const { serverPublicKey } = getClientCryptoConfig();

type ClientJWEResponse = {
    encReqPayload: string;
    encReqKey: string | null;
    base64ivReq: string | null;
};

export async function clientencryptJWE(
    context: ServiceContext
): Promise<ServiceResponse> {

    const requestPayload = clientCryptoRequestSerializer(
        context.payload,
        context.requestMediaType!
    );

    if (requestPayload === null) {
        return {
            statusCode: 415,
            payload: {
                errorCode: 'UNSUPPORTED_CRYPTO_REQUEST_CONTENT_TYPE',
                message: 'Unsupported Content-Type for client cryptography service',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    const protectedHeader = encodeBase64Url(
        stringToBytes(
            JSON.stringify({
                alg: 'RSA-OAEP-256',
                enc: 'A256GCM',
                typ: 'JWE',
            })
        )
    );

    const cek = generateRandomBytes(32);
    const iv = generateRandomBytes(12);

    let encryptedBuffer: ArrayBuffer;

    try {
        encryptedBuffer = await encryptAES_GCM(
            cek,
            iv,
            stringToBytes(requestPayload),
            stringToBytes(protectedHeader),
            128
        );
    } catch {
        return {
            statusCode: 500,
            payload: {
                errorCode: 'JWE_ENCRYPTION_FAILED',
                message: 'Failed to encrypt request payload',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    const tagLengthBytes = 128 / 8;

    const cipherText = encryptedBytes.slice(
        0,
        encryptedBytes.length - tagLengthBytes
    );

    const authenticationTag = encryptedBytes.slice(
        encryptedBytes.length - tagLengthBytes
    );

    let encryptedKey: Buffer;

    try {
        encryptedKey = encryptRSA(
            serverPublicKey,
            cek,
            constants.RSA_PKCS1_OAEP_PADDING,
            'sha256'
        );
    } catch {
        return {
            statusCode: 500,
            payload: {
                errorCode: 'JWE_KEY_ENCRYPTION_FAILED',
                message: 'Failed to encrypt content encryption key',
            },
            responseHeaders: {
                'content-type': ['application/json'],
            },
        };
    }

    const compactJWE = [
        protectedHeader,
        encodeBase64Url(encryptedKey),
        encodeBase64Url(iv),
        encodeBase64Url(cipherText),
        encodeBase64Url(authenticationTag),
    ].join('.');

    return {
        statusCode: 200,
        payload: {
            encReqPayload: compactJWE,
            encReqKey: '',
            base64ivReq: '',
        } satisfies ClientJWEResponse,
        responseHeaders: {
            'content-type': ['application/json'],
        },
    };
}