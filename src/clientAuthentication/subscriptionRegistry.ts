export type SubscriptionDefinition = {
    clientId: string;
    subscriptionPending: string[];
    subscriptionApproved: string[];
};

export const subscriptionRegistry = new Map<string, SubscriptionDefinition>([
    [
        'AT-CLIENT-001',
        {
            clientId: 'AT-CLIENT-001',
            subscriptionPending: [],
            subscriptionApproved: [
                'echoService',
                'clientdecryptAES_RSA',
                'clientencryptAES_RSA',
                'clientdecryptJWE',
                'clientencryptJWE',
                'clientdecryptJWS_AES_RSA',
                'clientencryptJWS_AES_RSA',
            ],
        },
    ],
]);