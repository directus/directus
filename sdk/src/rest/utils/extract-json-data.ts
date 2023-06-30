/**
 * 
 * @param response Fetch Response
 * @returns Unpacked data
 */
export async function extractJsonData<Output>(response: Response) {
	if (!response.ok) {
		/** @TODO Do better error handling */
		throw new Error('Request errored');
	}

	const data = (await response.json()) as { data: Output };

	return data.data;
}
