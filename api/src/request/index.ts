import type { AxiosInstance } from 'axios';
import { requestInterceptor } from './request-interceptor.js';

export const _cache: { axiosInstance: AxiosInstance | null } = {
	axiosInstance: null,
};

export async function getAxios() {
	if (!_cache.axiosInstance) {
		const axios = (await import('axios')).default;
		_cache.axiosInstance = axios.create();
		_cache.axiosInstance.interceptors.request.use(requestInterceptor);
	}

	return _cache.axiosInstance;
}
