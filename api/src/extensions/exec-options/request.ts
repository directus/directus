import { addExecOptions } from '../utils/add-exec-options.js';
import { EXEC_REQUEST } from '../validation/request.js';

export default addExecOptions(({ extension }) => {
	async function request(args: unknown[]) {
		// required until zod supports optional tuples
		args[2] = args[2] ?? undefined;

		const [_, url, options] = EXEC_REQUEST.parse(args);

		const permission = extension.granted_permissions?.find(
			(permission) => permission.permission === 'request'
		) as ExtensionPermission & { permission: 'request' };

		if (!permission) {
			throw new Error(`You do not have access to "request" `);
		}

		if (permission?.allowedUrls?.length) {
			let matchFound = false;

			for (const allowedUrl of permission.allowedUrls) {
				try {
					const allowedUrlRegex = new RegExp(allowedUrl);

					if (allowedUrlRegex.test(url)) {
						matchFound = true;
						break;
					}
				} catch (error) {
					const allowedUrlRegex = new RegExp(`/${allowedUrl.replace(/\*/g, '[^ ]*')}/`);

					if (allowedUrlRegex.test(url)) {
						matchFound = true;
						break;
					}
				}
			}

			if (!matchFound) {
				throw new Error(`Access to "${url}" is not allowed.`);
			}
		}

		const response = await fetch(url, {
			method: options?.method ?? 'GET',
			headers: options?.headers ?? {},
			body: options?.body ?? null,
		});

		if (options?.output === 'json') {
			return response.json();
		} else {
			return response.text();
		}
	}

	return {
		request: request,
	};
});
