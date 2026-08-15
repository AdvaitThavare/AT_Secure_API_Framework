/**
 * Encryption Type : AES_RSA
 * AES              : AES-256-CBC
 * Padding          : PKCS#7
 * IV               : 16 bytes
 * Key Encryption   : RSA/ECB/PKCS1Padding
 * Signature        : None
 */

import type { RequestContext } from '../../../context/requestContext';
import type { AppError } from '../../../errors/errorHandler';
import { constants, privateDecrypt, webcrypto, } from 'node:crypto';
import { getCryptoFunctionKeys } from '../../../serverManagement/cryptoFunctionKeys';
import { bytesToString, decodeBase64, stringToBytes } from '../../commonCrypto/commonCryptoUtilities';


const { serverPrivateKey } = getCryptoFunctionKeys();

const IV = 'asdfghjkasdfghjk';

export async function decryptAES_RSA(
    context: RequestContext
): Promise<AppError | null> {
    const wrapper = context.encryptedWrapper;

    // ===== RSA Decryption =====

    let decryptedKey: Buffer;

    try {
        decryptedKey = privateDecrypt(
            {
                key: serverPrivateKey,
                padding: constants.RSA_PKCS1_PADDING,
            },
            decodeBase64(wrapper!.key!)
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_ENCRYPTED_KEY',
            message: 'Failed to decrypt content encryption key',
        };
    }

    // ===== Convert AES Parameters =====

    const iv = stringToBytes(IV);

    const encryptedPayload = decodeBase64(
        wrapper!.payload
    );

    // ===== AES-CBC Decryption =====

    let decryptedBuffer: ArrayBuffer;

    try {
        const aesKey = await webcrypto.subtle.importKey(
            'raw',
            new Uint8Array(decryptedKey),
            {
                name: 'AES-CBC',
            },
            false,
            ['decrypt']
        );

        decryptedBuffer = await webcrypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv,
            },
            aesKey,
            encryptedPayload
        );
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_AES_RSA_PAYLOAD',
            message: 'Failed to decrypt AES_RSA payload',
        };
    }

    // ===== Convert Decrypted Payload to JSON =====

    try {
        const decryptedString = bytesToString(
            decryptedBuffer
        );

        context.payload = JSON.parse(decryptedString);

        return null;
    } catch {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'INVALID_DECRYPTED_PAYLOAD',
            message: 'Decrypted payload is not valid JSON',
        };
    }
}