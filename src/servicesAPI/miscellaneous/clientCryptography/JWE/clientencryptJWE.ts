import { constants } from 'node:crypto';
import { encryptAES_GCM } from '../../../../cryptography/cryptoAlgorithms/AES_Utility/AES_GCM';
import { encryptRSA } from '../../../../cryptography/cryptoAlgorithms/RSA_Utility/RSA_Crypto';
import { encodeBase64Url, generateRandomBytes, stringToBytes } from '../../../../cryptography/commonCrypto/commonCryptoUtilities';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { getClientCryptoConfig } from '../clientCryptoConfig';

const { serverPublicKey } = getClientCryptoConfig();

type ClientJWEResponse = {
    encReqPayload: string;
    encReqKey: string;
    base64iv: string;
};

export async function clientencryptJWE(
    context: ServiceContext
): Promise<ServiceResponse> {

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
            stringToBytes(JSON.stringify(context.payload)),
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
            base64iv: '',
        } satisfies ClientJWEResponse,
        responseHeaders: {
            'content-type': ['application/json'],
        },
    };
}