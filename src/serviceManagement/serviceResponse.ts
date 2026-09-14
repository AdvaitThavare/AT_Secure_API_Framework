export type ServiceResponse = {
  statusCode: number;
  payload: unknown;
  payloadContentType: string;
  responseHeaders: Record<string, string[]>;
};