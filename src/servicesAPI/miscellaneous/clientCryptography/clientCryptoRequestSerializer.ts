type ClientCryptoRequestSerializer = (
    payload: unknown
) => string;

const clientCryptoRequestSerializerMap =
    new Map<string, ClientCryptoRequestSerializer>([
        [
            'application/json',
            (payload) => JSON.stringify(payload),
        ],
        [
            'text/plain',
            (payload) => String(payload),
        ],
    ]);

export function clientCryptoRequestSerializer(
    payload: unknown,
    contentType: string
): string | null {

    const serializer =
        clientCryptoRequestSerializerMap.get(contentType);

    if (!serializer) {
        return null;
    }

    return serializer(payload);
}