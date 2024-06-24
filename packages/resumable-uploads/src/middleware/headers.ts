import type { RequestHandler, Request, Response } from "express";
import { EXPOSED_HEADERS, TUS_RESUMABLE, type CancellationContext } from "@tus/utils";
import { validateHeader } from "../validator.js";

export const validateTusHeaders: RequestHandler = (req, res, next) => {
 	const context = req.cancel!;

	// console.log(`[TusServer] handle: ${req.method} ${req.url}`);

	// The Tus-Resumable header MUST be included in every request and
	// response except for OPTIONS requests. The value MUST be the version
	// of the protocol used by the Client or the Server.
	res.setHeader('Tus-Resumable', TUS_RESUMABLE);

	if (req.method !== 'OPTIONS' && req.headers['tus-resumable'] === undefined) {
		return write(context, req, res, 412, 'Tus-Resumable Required\n');
	}

	// Validate all required headers to adhere to the tus protocol
	const invalid_headers = [];

	for (const header_name in req.headers) {
		if (req.method === 'OPTIONS') {
			continue;
		}

		// Content type is only checked for PATCH requests. For all other
		// request methods it will be ignored and treated as no content type
		// was set because some HTTP clients may enforce a default value for
		// this header.
		// See https://github.com/tus/tus-node-server/pull/116
		if (header_name.toLowerCase() === 'content-type' && req.method !== 'PATCH') {
			continue;
		}

		if (!validateHeader(header_name, req.headers[header_name] as string | undefined)) {
			// eslint-disable-next-line no-console
			console.log(`Invalid ${header_name} header: ${req.headers[header_name]}`);
			invalid_headers.push(header_name);
		}
	}

	if (invalid_headers.length > 0) {
		return write(context, req, res, 400, `Invalid ${invalid_headers.join(' ')}\n`);
	}

	// Enable CORS
	res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS);

	if (req.headers.origin) {
		res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
	}

	return next();
};

function write(
	context: CancellationContext,
	req: Request,
	res: Response,
	status: number,
	body = '',
	headers = {},
) {
	const isAborted = context.signal.aborted;

	if (status !== 204) {
		// @ts-expect-error not explicitly typed but possible
		headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
	}

	if (isAborted) {
		// This condition handles situations where the request has been flagged as aborted.
		// In such cases, the server informs the client that the connection will be closed.
		// This is communicated by setting the 'Connection' header to 'close' in the response.
		// This step is essential to prevent the server from continuing to process a request
		// that is no longer needed, thereby saving resources.

		// @ts-expect-error not explicitly typed but possible
		headers['Connection'] = 'close';

		// An event listener is added to the response ('res') for the 'finish' event.
		// The 'finish' event is triggered when the response has been sent to the client.
		// Once the response is complete, the request ('req') object is destroyed.
		// Destroying the request object is a crucial step to release any resources
		// tied to this request, as it has already been aborted.
		res.on('finish', () => {
			req.destroy();
		});
	}

	res.writeHead(status, headers);
	res.write(body);
	return res.end();
}


