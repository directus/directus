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
	options.headers =
		typeof options.headers === 'object' && !Array.isArray(options.headers)
			? (options.headers as Record<string, string>)
			: {};

	const defaultFormatter = (data: Output | { data: Output }) => {
		if (typeof data === 'object' && data && 'data' in data) {
			return data.data;
		}

		return data;
	};

	const outputFormatter = formatter !== undefined && formatter !== null ? formatter : defaultFormatter;

	const response = await globalThis
		.fetch(url, options)
		.then(async (response) => {
			const type = response.headers.get('Content-Type')?.toLowerCase();

			if (type?.startsWith('application/json')) {
				const result = await response.json();
				if (!response.ok) throw result;
				return result;
			}

			if (type?.startsWith('text/html') || type?.startsWith('text/plain')) {
				const result = await response.text();
				if (!response.ok) throw result;
				return result;
			}

			// empty body fallback
			return;
		})
		.catch((err) => {
			throw err;
		});

	return outputFormatter(response);
};
