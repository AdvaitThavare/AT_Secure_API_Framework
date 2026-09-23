import fs from 'node:fs';
import path from 'node:path';
import type { TLSSocket } from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { HEADER_AT_CLIENT_ID, HEADER_AT_CLIENT_SECRET } from '../constants/headerConstants';
import type { RequestContext } from '../context/requestContext';
import type { AppError } from '../errors/errorHandler';
import { clientRegistry, type ClientDefinition } from './clientRegistry';
import { subscriptionRegistry } from './subscriptionRegistry';

function getClientCredentials(
    context: RequestContext
): { clientId: string; clientSecret: string } | AppError {
    const clientIdValues = context.requestHeaders[HEADER_AT_CLIENT_ID];
    const clientSecretValues = context.requestHeaders[HEADER_AT_CLIENT_SECRET];

    const clientId = clientIdValues?.[0]?.trim();
    const clientSecret = clientSecretValues?.[0]?.trim();

    if (!clientId || !clientSecret) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'MISSING_CLIENT_CREDENTIALS',
            message: 'Client ID or Client Secret is missing',
        };
    }

    if (clientIdValues?.length !== 1 || clientSecretValues?.length !== 1) {
        return {
            category: 'SERVER',
            statusCode: 400,
            errorCode: 'MULTIPLE_HEADER_VALUES',
            message: 'Multiple values for the same header are not allowed',
        };
    }

    return {
        clientId,
        clientSecret,
    };
}

function validateClientCredentials(
    clientId: string,
    clientSecret: string
): ClientDefinition | AppError {
    const clientDefinition = clientRegistry.get(clientId);

    if (!clientDefinition || clientDefinition.clientSecret !== clientSecret) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'INVALID_CLIENT_CREDENTIALS',
            message: 'Invalid client credentials',
        };
    }

    return clientDefinition;
}

function validateClientCertificate(
    context: RequestContext,
    clientDefinition: ClientDefinition
): AppError | null {
    const tlsSocket = context.req.socket as TLSSocket;
    const peerCertificate = tlsSocket.getPeerCertificate(true);

    const expectedCertificatePath =
        path.resolve(
            process.cwd(),
            clientDefinition.certificate.path
        );

    const expectedCertificate =
        new X509Certificate(
            fs.readFileSync(expectedCertificatePath)
        );

    const actualCertificate =
        new X509Certificate(
            peerCertificate.raw
        );

    if (expectedCertificate.raw.compare(actualCertificate.raw) !== 0) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'INVALID_CLIENT_CERTIFICATE',
            message: 'The client certificate presented does not match the provided Client ID.',
        };
    }

    return null;
}

function validateSubscription(
    clientId: string,
    serviceKey: string
): AppError | null {
    const subscription = subscriptionRegistry.get(clientId);

    if (subscription?.subscriptionApproved.includes(serviceKey)) {
        return null;
    }

    if (subscription?.subscriptionPending.includes(serviceKey)) {
        return {
            category: 'SERVER',
            statusCode: 403,
            errorCode: 'API_NOT_SUBSCRIBED',
            message: 'API Subscription request pending approval.',
        };
    }

    return {
        category: 'SERVER',
        statusCode: 403,
        errorCode: 'API_NOT_SUBSCRIBED',
        message: 'Client Id has no active subscription for this API',
    };
}

export function clientAuthenticator(
    context: RequestContext,
    serviceKey: string
): AppError | null {
    const credentials = getClientCredentials(context);

    if ('statusCode' in credentials) {
        return credentials;
    }

    const clientDefinition =
        validateClientCredentials(
            credentials.clientId,
            credentials.clientSecret
        );

    if ('statusCode' in clientDefinition) {
        return clientDefinition;
    }

    const certificateError =
        validateClientCertificate(
            context,
            clientDefinition
        );

    if (certificateError) {
        return certificateError;
    }

    const subscriptionError =
        validateSubscription(
            credentials.clientId,
            serviceKey
        );

    if (subscriptionError) {
        return subscriptionError;
    }

    context.clientId = credentials.clientId;

    return null;
}