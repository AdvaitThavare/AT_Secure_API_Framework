import type { IncomingMessage } from 'node:http';
import type { RequestContext } from '../context/requestContext';
import { normalizeHeaders } from '../context/headerUtils';

export async function requestHandler(
    req: IncomingMessage
): Promise<RequestContext> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return {
        req,
        requestRawBody: Buffer.concat(chunks).toString(),
        requestHeaders: normalizeHeaders(req.headers),
        responseHeaders: {},
    };
}