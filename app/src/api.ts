import { useRequestsStore } from '@/stores/requests';
import { getRootPath } from '@/utils/get-root-path';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import PQueue, { type Options } from 'p-queue';

const api = axios.create({
	baseURL: getRootPath(),
	withCredentials: true,
});

let queue = new PQueue({ concurrency: 5, intervalCap: 5, interval: 500, carryoverConcurrencyCount: true });

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
		if (config.url && config.url === '/auth/refresh') {
			queue.pause();
			return resolve(requestConfig);
		}

		queue.add(() => {
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
	if (!queue.isPaused) return;
	queue.start();
}

export async function replaceQueue(options?: Options<any, QueueAddOptions>) {
	await queue.onIdle();
	queue = new PQueue(options);
}
