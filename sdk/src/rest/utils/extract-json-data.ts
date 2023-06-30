/**
 * 
 * @param response Fetch Response
 * @returns Unpacked data
 */
export async function extractJsonData<Output>(response: Response) {
	if (!response.ok) {
		throw response;
	}

	const data = (await response.json()) as { data: Output };

	return data.data;
}
