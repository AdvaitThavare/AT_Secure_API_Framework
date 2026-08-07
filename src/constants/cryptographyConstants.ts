export const PAYLOAD_STATES = [
  'PLAIN',
  'ENCRYPTED',
] as const;

export const DATA_ENCRYPTIONS = [
  'NA',
  'JWE',
  'HIGH',
  'MEDIUM',
] as const;

export type PayloadState =
  typeof PAYLOAD_STATES[number];

export type DataEncryption =
  typeof DATA_ENCRYPTIONS[number];