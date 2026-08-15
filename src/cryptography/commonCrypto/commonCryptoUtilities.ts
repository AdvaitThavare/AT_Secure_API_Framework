import { randomBytes } from 'node:crypto';

export function generateRandomBytes(length: number): Uint8Array<ArrayBuffer> {
    const bytes = randomBytes(length);
    const result = new Uint8Array(new ArrayBuffer(bytes.length));
    result.set(bytes);
    return result;
}

export function stringToBytes(value: string): Uint8Array<ArrayBuffer> {
    const encoded = new TextEncoder().encode(value);
    const result = new Uint8Array(new ArrayBuffer(encoded.length));
    result.set(encoded);
    return result;
}

export function bytesToString(value: ArrayBuffer | Uint8Array<ArrayBufferLike>): string {
    return new TextDecoder().decode(value);
}

export function encodeBase64(value: Uint8Array): string {
    return Buffer.from(value).toString('base64');
}

export function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
    const decoded = Buffer.from(value, 'base64');
    const result = new Uint8Array(new ArrayBuffer(decoded.length));
    result.set(decoded);
    return result;
}

export function encodeBase64Url(value: Uint8Array): string {
    return Buffer.from(value).toString('base64url');
}

export function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
    const decoded = Buffer.from(value, 'base64url');
    const result = new Uint8Array(new ArrayBuffer(decoded.length));
    result.set(decoded);
    return result;
}