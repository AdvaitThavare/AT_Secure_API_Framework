export type ServiceResponse = {
  statusCode: number;
  payload: unknown;
  responseHeaders: Record<string, string[]>;
};