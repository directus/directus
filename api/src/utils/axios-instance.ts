import axios, { AxiosRequestConfig, Method } from 'axios';
import { getConfigFromEnv } from './get-config-from-env';

const config: AxiosRequestConfig<any> = getConfigFromEnv('AXIOS_') ?? {};

export { Method, AxiosRequestConfig };
export default axios.create(config);
