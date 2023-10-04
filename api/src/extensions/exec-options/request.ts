import { EXEC_REQUEST } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import type { ExtensionPermission } from "@directus/types";


export default addExecOptions(({ extension }) => {
	async function request(args: unknown[]) {

		const [_, url, options] = EXEC_REQUEST.parse(args);

		const permission = extension.requested_permissions?.find((permission) => permission.permission === 'request') as ExtensionPermission & { permission: 'request' }

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
				}
				catch (error) {
					const allowedUrlRegex = new RegExp(`/${allowedUrl.replace(/\*/g, "[^ ]*")}/`);

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
		'request': request,
	}

})
