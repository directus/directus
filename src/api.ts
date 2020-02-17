import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useRequestsStore } from '@/stores/requests';

const api = axios.create({
	baseURL: getRootPath()
});

interface RequestConfig extends AxiosRequestConfig {
	id: string;
}

interface Response extends AxiosResponse {
	config: RequestConfig;
}

export const onRequest = (config: AxiosRequestConfig) => {
	const requestsStore = useRequestsStore();
	const id = requestsStore.startRequest();

	const requestConfig: RequestConfig = {
		id: id,
		...config
	};

	return requestConfig;
};

export const onResponse = (response: AxiosResponse | Response) => {
	const requestsStore = useRequestsStore();
	const id = (response.config as RequestConfig).id;
	requestsStore.endRequest(id);
	return response;
};

export const onError = (error: any) => {
	const requestsStore = useRequestsStore();
	const id = (error.response.config as RequestConfig).id;
	requestsStore.endRequest(id);
	return Promise.reject(error);
};

api.interceptors.request.use(onRequest);
api.interceptors.response.use(onResponse, onError);

export function getRootPath(): string {
	const path = window.location.pathname;
	const parts = path.split('/');
	const adminIndex = parts.indexOf('admin');
	const rootPath = parts.slice(0, adminIndex).join('/') + '/';
	return rootPath;
}

export default api;
