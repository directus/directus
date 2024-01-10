import type { AxiosResponse } from 'axios';
import { validateIp } from './validate-ip.js';

export const responseInterceptor = async (config: AxiosResponse<any, any>) => {
	validateIp(config.request.socket.remoteAddress, config.request.url);
	return config;
};
