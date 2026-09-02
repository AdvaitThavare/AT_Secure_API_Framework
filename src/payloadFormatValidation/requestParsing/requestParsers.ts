export type ParseResult =
  | {
    success: true;
    payload: unknown;
  }
  | {
    success: false;
  };

type RequestParser = (rawBody: string) => ParseResult;

export function parseJSON(rawBody: string): ParseResult {
  try {
    const payload = JSON.parse(rawBody);

    if (
      typeof payload !== 'object' ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return { success: false };
    }
    return {
      success: true,
      payload,
    };
  } catch {
    return {
      success: false,
    };
  }
}

export function parseText(rawBody: string): ParseResult {
  return {
    success: true,
    payload: rawBody,
  };
}

export const requestParserMap = new Map<string, RequestParser>([
  ['application/json', parseJSON],
  ['text/plain', parseText],
]);