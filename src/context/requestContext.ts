import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PayloadState, DataEncryption } from '../constants/cryptographyConstants';

export type EncryptedWrapper = {
  payload: string;
  key?: string;
};

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  rawBody: string;
  payload?: unknown;
  serviceResponse?: unknown;
  contentType: string;
  payloadType?: PayloadState;
  encryptionType?: DataEncryption;
  encryptedWrapper?: EncryptedWrapper;
}