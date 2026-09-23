export type ClientDefinition = {
    emailId: string;
    applicationName: string;
    clientId: string;
    clientSecret: string;
    certificate: {
        name: string;
        path: string;
    };
};

export const clientRegistry = new Map<string, ClientDefinition>([
    [
        'AT-CLIENT-001',
        {
            emailId: 'client1@example.com',
            applicationName: 'Application A',
            clientId: 'AT-CLIENT-001',
            clientSecret: 'AT-SECRET-001',
            certificate: {
                name: 'client.crt',
                path: 'certs/client/client.crt',
            },
        },
    ],
]);