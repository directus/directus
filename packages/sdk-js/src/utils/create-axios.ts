import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * createAxiosInstance creates an axios instance with predefined defaults
 * @param config - AxiosRequestConfig
 */
export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
	const axiosInstance = axios.create(config);

	axiosInstance.interceptors.response.use(
		(res) => res,
		(err: AxiosError) => {
			const apiErrors = err.response?.data?.errors;
			if (apiErrors) {
				return Promise.reject(apiErrors);
			}

			return Promise.reject(err);
		}
	);

	return axiosInstance;
};
