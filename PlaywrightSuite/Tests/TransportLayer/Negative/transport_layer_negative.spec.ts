import { expect, request, test } from '@playwright/test';
import { serverConfig } from '../../../../src/serverManagement/serverConfig';
import path from 'node:path';

test('TLS_NEG_001_MissingClientCertificate', async () => {
    const baseURL = `https://${serverConfig.host}:${serverConfig.port}`;

    const apiContext = await request.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
    });

    let requestError: unknown;

    try {
        await apiContext.fetch('/echo', {
            method: 'POST',
            headers: {
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'Content-Type': 'application/json',
                'x-enc-wrapper-content-type': 'NA',
            },
            data: {
                name: 'Advait',
            },
        });
    } catch (error) {
        requestError = error;
        // console.log('TLS handshake error:', error);
    } finally {
        await apiContext.dispose();
    }

    expect(requestError).toBeDefined();
});


test('TLS_NEG_002_ClientCertificateSignedByUntrustedCA', async () => {
    const baseURL = `https://${serverConfig.host}:${serverConfig.port}`;

    const certPath = path.resolve(
        process.cwd(),
        'PlaywrightSuite/Tests/TransportLayer/UntrustedCertificate/client.crt'
    );

    const keyPath = path.resolve(
        process.cwd(),
        'PlaywrightSuite/Tests/TransportLayer/UntrustedCertificate/client.key'
    );

    const apiContext = await request.newContext({
        baseURL,
        clientCertificates: [
            {
                origin: baseURL,
                certPath,
                keyPath,
            },
        ],
        ignoreHTTPSErrors: true,
    });

    let requestError: unknown;

    try {
        await apiContext.fetch('/echo', {
            method: 'POST',
            headers: {
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'Content-Type': 'application/json',
                'x-enc-wrapper-content-type': 'NA',
            },
            data: {
                name: 'Advait',
            },
        });
    } catch (error) {
        requestError = error;
        // console.log('TLS handshake error:', error);
    } finally {
        await apiContext.dispose();
    }

    expect(requestError).toBeDefined();
});


test('TLS_NEG_003_InvalidClientCertificatePrivateKeyPair', async () => {
    const baseURL = `https://${serverConfig.host}:${serverConfig.port}`;

    const certPath = path.resolve(
        process.cwd(),
        'certs/client/client.crt'
    );

    const keyPath = path.resolve(
        process.cwd(),
        'certs/server/server.key'
    );

    const apiContext = await request.newContext({
        baseURL,
        clientCertificates: [
            {
                origin: baseURL,
                certPath,
                keyPath,
            },
        ],
        ignoreHTTPSErrors: true,
    });

    let requestError: unknown;

    try {
        await apiContext.fetch('/echo', {
            method: 'POST',
            headers: {
                'x-payload-state': 'PLAIN',
                'x-data-encryption': 'NA',
                'Content-Type': 'application/json',
                'x-enc-wrapper-content-type': 'NA',
            },
            data: {
                name: 'Advait',
            },
        });
    } catch (error) {
        requestError = error;
        // console.log('TLS error:', error);
    } finally {
        await apiContext.dispose();
    }

    expect(requestError).toBeDefined();
});


// test('TLS_NEG_004_InvalidServerHostname', async () => {
//     const baseURL = `https://wronghost.localhost:${serverConfig.port}`;

//     const certPath = path.resolve(
//         process.cwd(),
//         'certs/client/client.crt'
//     );

//     const keyPath = path.resolve(
//         process.cwd(),
//         'certs/client/client.key'
//     );

//     const apiContext = await request.newContext({
//         baseURL,
//         clientCertificates: [
//             {
//                 origin: baseURL,
//                 certPath,
//                 keyPath,
//             },
//         ],
//     });

//     let requestError: unknown;

//     try {
//         await apiContext.fetch('/echo', {
//             method: 'POST',
//             headers: {
//                 'x-payload-state': 'PLAIN',
//                 'x-data-encryption': 'NA',
//                 'Content-Type': 'application/json',
//                 'x-enc-wrapper-content-type': 'NA',
//             },
//             data: {
//                 name: 'Advait',
//             },
//         });
//     } catch (error) {
//         requestError = error;
//         console.log('TLS error:', error);
//     } finally {
//         await apiContext.dispose();
//     }

//     expect(requestError).toBeDefined();
// });
