export function normalizeMediaType(
  contentType: string
): string {
  return contentType
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
}