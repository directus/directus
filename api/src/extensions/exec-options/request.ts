import { EXEC_REQUEST } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";


export default addExecOptions(() => {
	function createRequestFn(result: 'text' | 'json') {
		return async function request(args: unknown[]) {

			const [_, url, options] = EXEC_REQUEST.parse(args);

			const response = await fetch(url, {
				method: options?.method ?? 'GET',
				headers: options?.headers ?? {},
				body: options?.body ?? null,
			});

			if (result === 'text') {
				return response.text();
			} else if (result === 'json') {
				return response.json();
			}
		}
	}

	return {
		'request': createRequestFn('text'),
		'request-json': createRequestFn('json'),
	}

})
