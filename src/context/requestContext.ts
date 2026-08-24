import type { IncomingMessage } from 'node:http';
import type { PayloadState, DataEncryption } from '../constants/payloadIdentifierConstants';

export type EncryptedWrapper = {
  payload: string;
  key?: string;
  base64iv?: string;
};

export interface RequestContext {
  req: IncomingMessage;
  requestRawBody: string;
  requestHeaders: Record<string, string[]>;
  responseHeaders: Record<string, string[]>;
  requestMediaType?: string;
  payload?: unknown;
  payloadType?: PayloadState;
  encryptionType?: DataEncryption;
  encryptedWrapper?: EncryptedWrapper;
}