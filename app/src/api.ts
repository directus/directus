import { useRequestsStore } from '@/stores/requests';
import { getRootPath } from '@/utils/get-root-path';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import PQueue, { type QueueAddOptions, type Options } from 'p-queue';
import sdk from './sdk';

const api = axios.create({
	baseURL: getRootPath(),
	withCredentials: true,
});

export let requestQueue: PQueue = new PQueue({
	concurrency: 5,
	intervalCap: 5,
	interval: 500,
	carryoverConcurrencyCount: true,
});

type RequestConfig = InternalAxiosRequestConfig & { id: string };
type Response = AxiosResponse & { config: RequestConfig };
export type RequestError = AxiosError & { response: Response };

export const onRequest = (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
	const requestsStore = useRequestsStore();
	const id = requestsStore.startRequest();

	const requestConfig: RequestConfig = {
		id: id,
		...config,
	};

	return new Promise((resolve) => {
		requestQueue.add(async () => {
			// use getToken to await currently active refreshes
			await sdk.getToken().catch(() => {
				/* fail gracefully */
			});

			return resolve(requestConfig);
		});
	});
};

export const onResponse = (response: AxiosResponse | Response): AxiosResponse | Response => {
	const requestsStore = useRequestsStore();
	const id = (response.config as RequestConfig)?.id;
	if (id) requestsStore.endRequest(id);
	return response;
};

export const onError = async (error: RequestError): Promise<RequestError> => {
	const requestsStore = useRequestsStore();

	// Note: Cancelled requests don't respond with the config
	const id = (error.response?.config as RequestConfig)?.id;

	if (id) requestsStore.endRequest(id);

	return Promise.reject(error);
};

api.interceptors.request.use(onRequest);
api.interceptors.response.use(onResponse, onError);

export default api;

export function resumeQueue() {
	if (!requestQueue.isPaused) return;
	requestQueue.start();
}

export async function replaceQueue(options?: Options<any, QueueAddOptions>) {
	await requestQueue.onIdle();
	requestQueue = new PQueue(options);
}
