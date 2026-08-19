export type CryptoExecutionContext = {
    protocol?: {
        alg?: string;
        enc?: string;
        typ?: string;
    };

    aes?: {
        keyLength?: number;
        ivLength?: number;
        tagLength?: number;
    };

    rsa?: {
        padding?: number;
        oaepHash?: string;
    };

    signature?: {
        algorithm?: string;
    };
};