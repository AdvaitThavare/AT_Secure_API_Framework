export type ClientCryptoResponse<T> = {
    responseStatus: {
        success: boolean;
    };
    responsePayload: T;
    responseContentType: string;
};