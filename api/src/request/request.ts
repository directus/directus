import type { AxiosInstance } from 'axios';
import { validateIP } from './validate-ip';

let axiosInstance: AxiosInstance;

export async function getAxios() {
	if (!axiosInstance) {
		const axios = (await import('axios')).default;

		axiosInstance = axios.create();

		axiosInstance.interceptors.response.use(async (config) => {
			await validateIP(config.request.socket.remoteAddress, config.request.url);
			return config;
		});
	}

	return axiosInstance;
}
