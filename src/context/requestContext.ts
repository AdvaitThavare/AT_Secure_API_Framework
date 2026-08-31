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

export type ServiceContext = Pick<
  RequestContext,
  'requestHeaders' |
  'requestMediaType' |
  'payload'
>;

export function createServiceContext(
  context: RequestContext
): ServiceContext {
  return {
    requestHeaders: context.requestHeaders,
    requestMediaType: context.requestMediaType,
    payload: context.payload,
  };
}