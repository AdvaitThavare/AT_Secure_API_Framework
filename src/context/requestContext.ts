import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PayloadState, DataEncryption } from '../constants/payloadIdentifierConstants';

export type EncryptedWrapper = {
  payload: string;
  key?: string;
  iv?: string;
};

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  requestRawBody: string;
  responseRawBody?: string;
  requestHeaders: Record<string, string[]>;
  responseHeaders: Record<string, string[]>;
  payload?: unknown;
  serviceResponse?: unknown;
  contentType: string;
  payloadType?: PayloadState;
  encryptionType?: DataEncryption;
  encryptedWrapper?: EncryptedWrapper;
}