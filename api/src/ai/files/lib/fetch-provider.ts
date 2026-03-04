const UPLOAD_TIMEOUT = 120_000;

export async function fetchProvider(url: string, options: RequestInit, providerName: string): Promise<unknown> {
	let response: Response;

	try {
		response = await fetch(url, { ...options, signal: AbortSignal.timeout(UPLOAD_TIMEOUT) });
	} catch (error) {
		if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
			throw new Error(`${providerName} upload timed out after ${UPLOAD_TIMEOUT / 1000}s`);
		}

		throw error;
	}

	if (!response.ok) {
		const text = await response.text().catch(() => `HTTP ${response.status}`);
		throw new Error(`${providerName} upload failed: ${text}`);
	}

	try {
		return await response.json();
	} catch (cause) {
		throw new Error(`${providerName} upload succeeded but returned invalid response`, { cause });
	}
}
