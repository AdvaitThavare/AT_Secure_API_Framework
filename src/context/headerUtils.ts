import type { IncomingHttpHeaders } from 'node:http';

export function normalizeHeaders(
  headers: IncomingHttpHeaders
): Record<string, string[]> {
  const normalizedHeaders: Record<string, string[]> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    normalizedHeaders[name.toLowerCase()] =
      Array.isArray(value)
        ? value
        : [value];
  }

  return normalizedHeaders;
}