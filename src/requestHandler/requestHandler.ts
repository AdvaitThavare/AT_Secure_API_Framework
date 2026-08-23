import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RequestContext } from '../context/requestContext';
import { normalizeHeaders } from '../context/headerUtils';

export async function requestHandler(
    req: IncomingMessage,
    res: ServerResponse
): Promise<RequestContext> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return {
        req,
        res,
        requestRawBody: Buffer.concat(chunks).toString(),
        requestHeaders: normalizeHeaders(req.headers),
        responseHeaders: {},
    };
}