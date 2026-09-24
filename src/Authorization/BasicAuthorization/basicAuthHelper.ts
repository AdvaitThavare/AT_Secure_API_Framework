import type { AppError } from '../../errors/errorHandler';
import { HEADER_AUTHORIZATION } from '../../constants/headerConstants';

export type BasicAuthCredentials = {
    username: string;
    password: string;
};

export function basicAuthHelper(
    requestHeaders: Record<string, string[]>
): BasicAuthCredentials | AppError {
    const authorizationValues =
        requestHeaders[HEADER_AUTHORIZATION];

    if (!authorizationValues || authorizationValues.length !== 1) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'BASIC_AUTHORIZATION_FAILURE',
            message: 'Invalid Username or Password',
        };
    }

    const authorizationValue =
        authorizationValues[0];

    const [scheme, encodedCredentials] =
        authorizationValue.split(' ');

    if (
        scheme?.toLowerCase() !== 'basic' ||
        !encodedCredentials
    ) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'BASIC_AUTHORIZATION_FAILURE',
            message: 'Invalid Username or Password',
        };
    }

    const decodedCredentials =
        Buffer.from(
            encodedCredentials,
            'base64'
        ).toString('utf8');

    const separatorIndex =
        decodedCredentials.indexOf(':');

    if (separatorIndex === -1) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'BASIC_AUTHORIZATION_FAILURE',
            message: 'Invalid Username or Password',
        };
    }

    const username =
        decodedCredentials.slice(
            0,
            separatorIndex
        );

    const password =
        decodedCredentials.slice(
            separatorIndex + 1
        );

    if (!username || !password) {
        return {
            category: 'SERVER',
            statusCode: 401,
            errorCode: 'BASIC_AUTHORIZATION_FAILURE',
            message: 'Invalid Username or Password',
        };
    }

    return {
        username,
        password,
    };
}