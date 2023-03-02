import type { AxiosResponse } from 'axios';
import { validateIP } from './validate-ip';

export const responseInterceptor = async (config: AxiosResponse<any, any>) => {
	await validateIP(config.request.socket.remoteAddress, config.request.url);
	return config;
};
