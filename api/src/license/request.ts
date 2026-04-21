import axios, { type AxiosInstance, type Method } from 'axios';
import { DIRECTUS_LICENSE_BASE_URL, DIRECTUS_LICENSE_VERSION } from './constants.js';
import { handleLicenseApiError, isTransientLicenseError } from './handle-api-error.js';

const LICENSE_REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRY_AFTER_MS = 60_000;
const RETRY_DELAYS_MS = [0, 1000, 2000, 5000];
let licenseClient: AxiosInstance | null = null;

export function getLicenseClient(): AxiosInstance {
	if (licenseClient) return licenseClient;

	licenseClient = axios.create({
		baseURL: DIRECTUS_LICENSE_BASE_URL,
		timeout: LICENSE_REQUEST_TIMEOUT_MS,
		headers: {
			'Content-Type': 'application/json',
			'Directus-License-Version': DIRECTUS_LICENSE_VERSION,
		},
	});

	return licenseClient;
}

export async function requestLicenseService<T>(
	method: Method,
	path: string,
	data?: Record<string, unknown>,
): Promise<T> {
	let lastError: unknown;
	const client = getLicenseClient();

	for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
		if (attempt > 0) {
			let delay = RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]!;

			if (axios.isAxiosError(lastError)) {
				const retryAfter = lastError.response?.data?.retry_after;

				if (typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0) {
					delay = Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS);
				}
			}

			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		try {
			const response = await client.request<T>({
				method,
				url: path,
				data,
			});

			return response.data;
		} catch (error) {
			lastError = error;

			if (!isTransientLicenseError(error) || attempt === RETRY_DELAYS_MS.length - 1) {
				break;
			}
		}
	}

	handleLicenseApiError(lastError);
}
