import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useRequestsStore } from '@/stores/';
import { LogoutReason, logout, refresh } from '@/auth';
import { getRootPath } from '@/utils/get-root-path';
import { addQueryToPath } from './utils/add-query-to-path';

const api = axios.create({
	baseURL: getRootPath(),
	withCredentials: true,
	headers: {
		'Cache-Control': 'no-cache',
	},
});

interface RequestConfig extends AxiosRequestConfig {
	id: string;
}

interface Response extends AxiosResponse {
	config: RequestConfig;
}

export interface RequestError extends AxiosError {
	response: Response;
}

export const onRequest = (config: AxiosRequestConfig): RequestConfig => {
	const requestsStore = useRequestsStore();
	const id = requestsStore.startRequest();

	const requestConfig: RequestConfig = {
		id: id,
		...config,
	};

	return requestConfig;
};

export const onResponse = (response: AxiosResponse | Response): AxiosResponse | Response => {
	const requestsStore = useRequestsStore();
	const id = (response.config as RequestConfig).id;
	requestsStore.endRequest(id);
	return response;
};

export const onError = async (error: RequestError): Promise<RequestError> => {
	const requestsStore = useRequestsStore();
	const id = (error.response.config as RequestConfig).id;
	requestsStore.endRequest(id);

	// If a request fails with the unauthorized error, it either means that your user doesn't have
	// access, or that your session doesn't exist / has expired.
	// In case of the second, we should force the app to logout completely and redirect to the login
	// view.
	/* istanbul ignore next */
	const status = error.response?.status;
	/* istanbul ignore next */
	const code = error.response?.data?.errors?.[0]?.extensions?.code;

	if (
		status === 401 &&
		code === 'INVALID_CREDENTIALS' &&
		error.request.responseURL.includes('refresh') === false &&
		error.request.responseURL.includes('login') === false &&
		error.request.responseURL.includes('tfa') === false
	) {
		let newToken: string | undefined;

		try {
			newToken = await refresh();
		} catch {
			logout({ reason: LogoutReason.SESSION_EXPIRED });
			return Promise.reject();
		}

		if (newToken) {
			return api.request({
				...error.config,
				headers: {
					Authorization: `Bearer ${newToken}`,
				},
			});
		}
	}

	return Promise.reject(error);
};

api.interceptors.request.use(onRequest);
api.interceptors.response.use(onResponse, onError);

export default api;

function getToken() {
	return api.defaults.headers?.['Authorization']?.split(' ')[1] || null;
}

export function addTokenToURL(url: string, token?: string): string {
	token = token || getToken();
	if (!token) return url;

	return addQueryToPath(url, { access_token: token });
}
