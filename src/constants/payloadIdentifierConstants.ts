export const PAYLOAD_STATES = [
  'PLAIN',
  'ENCRYPTED',
] as const;

export const DATA_ENCRYPTIONS = [
  'NA',
  'JWE',
  'JWS_AES_RSA',
  'AES_RSA',
] as const;

export const ENC_WRAPPER_CONTENT_TYPES = [
  'NA',
  'application/json',
] as const;

export type PayloadState =
  typeof PAYLOAD_STATES[number];

export type DataEncryption =
  typeof DATA_ENCRYPTIONS[number];

export type EncWrapperContentType =
  typeof ENC_WRAPPER_CONTENT_TYPES[number];