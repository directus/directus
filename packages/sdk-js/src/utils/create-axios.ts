import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * createAxiosInstance creates an axios instance with predefined defaults
 * @param config - AxiosRequestConfig
 */
export const createAxiosInstance = (config?: AxiosRequestConfig): AxiosInstance => {
	return axios.create({
		validateStatus: (status) => {
			return status < 500;
		},
		...config,
	});
};
