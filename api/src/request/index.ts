import type { AxiosInstance } from 'axios';
import { requestInterceptor } from './request-interceptor.js';
import { responseInterceptor } from './response-interceptor.js';

export const _cache: { axiosInstance: AxiosInstance | null } = {
	axiosInstance: null,
};

export async function getAxios() {
	if (!_cache.axiosInstance) {
		const axios = (await import('axios')).default;
		_cache.axiosInstance = axios.create();
		_cache.axiosInstance.interceptors.request.use(requestInterceptor);
		_cache.axiosInstance.interceptors.response.use(responseInterceptor);
	}

	return _cache.axiosInstance;
}
