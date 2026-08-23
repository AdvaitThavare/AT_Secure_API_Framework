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
    return {
      success: true,
      payload: JSON.parse(rawBody),
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