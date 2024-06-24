import { TUS_VERSION, TUS_RESUMABLE, Metadata } from '@tus/utils';

type validator = (value?: string) => boolean;

export const validators = new Map<string, validator>([
	[
		// The Upload-Offset request and response header indicates a byte offset within a resource.
		// The value MUST be a non-negative integer.
		'upload-offset',
		function (value) {
			const n = Number(value);
			return Number.isInteger(n) && String(n) === value && n >= 0;
		},
	],
	[
		// The Upload-Length request and response header indicates the size of the entire upload in bytes.
		// The value MUST be a non-negative integer.
		'upload-length',
		function (value) {
			const n = Number(value);
			return Number.isInteger(n) && String(n) === value && n >= 0;
		},
	],
	[
		// The Upload-Defer-Length request and response header indicates that the size of the upload
		// is not known currently and will be transferred later.
		// Its value MUST be 1. If the length of an upload is not deferred, this header MUST be omitted.
		'upload-defer-length',
		function (value) {
			return value === '1';
		},
	],
	[
		'upload-metadata',
		// The Upload-Metadata request and response header MUST consist of one
		// or more comma-separated key-value pairs. The key and value MUST be
		// separated by a space. The key MUST NOT contain spaces and commas and
		// MUST NOT be empty. The key SHOULD be ASCII encoded and the value MUST
		// be Base64 encoded. All keys MUST be unique.
		function (value) {
			try {
				Metadata.parse(value);
				return true;
			} catch {
				return false;
			}
		},
	],
	[
		'x-forwarded-proto',
		function (value) {
			if (value === 'http' || value === 'https') {
				return true;
			}

			return false;
		},
	],
	[
		// The Tus-Version response header MUST be a comma-separated list of protocol versions supported by the Server.
		// The list MUST be sorted by Server's preference where the first one is the most preferred one.
		'tus-version',
		function (value) {
			// @ts-expect-error we can compare a literal
			return TUS_VERSION.includes(value);
		},
	],
	[
		// The Tus-Resumable header MUST be included in every request and response except for OPTIONS requests.
		// The value MUST be the version of the protocol used by the Client or the Server.
		// If the version specified by the Client is not supported by the Server,
		// it MUST respond with the 412 Precondition Failed status and MUST include the Tus-Version header into the response.
		// In addition, the Server MUST NOT process the request.
		'tus-resumable',
		function (value) {
			return value === TUS_RESUMABLE;
		},
	],
	[
		'content-type',
		function (value) {
			return value === 'application/offset+octet-stream';
		},
	],
	[
		// The Upload-Concat request and response header MUST be set in both partial and final upload creation requests.
		// It indicates whether the upload is either a partial or final upload.
		// If the upload is a partial one, the header value MUST be partial.
		// In the case of a final upload, its value MUST be final followed by a semicolon and a space-separated list
		// of partial upload URLs that will be concatenated.
		// The partial uploads URLs MAY be absolute or relative and MUST NOT contain spaces as defined in RFC 3986.
		'upload-concat',
		function (value) {
			if (!value) return false;
			const valid_partial = value === 'partial';
			const valid_final = value.startsWith('final;');
			return valid_partial || valid_final;
		},
	],
]);

export function validateHeader(name: string, value?: string): boolean {
	const lowercaseName = name.toLowerCase();

	if (!validators.has(lowercaseName)) {
		return true;
	}

	// @ts-expect-error if already guards
	return validators.get(lowercaseName)(value);
}
