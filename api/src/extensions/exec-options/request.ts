import { EXEC_REQUEST } from "@directus/constants";
import { addExecOptions } from "../add-exec-options.js";


export default addExecOptions(() => {
	function createRequestFn(result: 'text' | 'json') {
		return async function request(options: unknown) {

			const validOptions = EXEC_REQUEST.parse(options);

			const response = await fetch(validOptions.url, {
				method: validOptions.method,
				headers: validOptions.headers,
				body: validOptions.body,
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
