/**
 * Request helper providing default settings
 *
 * @param url The request URL
 * @param options The request options
 *
 * @returns The API result if successful
 */
export const request = async <Output = any>(
	url: string,
	options: RequestInit,
	formatter?: ((data: any) => Output) | null
): Promise<Output> => {
	const headers =
		typeof options.headers === 'object' && !Array.isArray(options.headers)
			? (options.headers as Record<string, string>)
			: {};

	const outputFormatter =
		formatter !== undefined && formatter !== null ? formatter : ({ data }: { data: Output }) => data;

	// use json content by default but allow overrides
	if ('Content-Type' in headers === false) {
		headers['Content-Type'] = 'application/json';
	}

	options.headers = headers;

	const response = await globalThis
		.fetch(url, options)
		.then(async (response) => {
			if (!response.ok) throw await response.json();
			if (formatter === null) return response.text();
			return response.json();
		})
		.catch((err) => {
			throw err;
		});

	return outputFormatter(response);
};
