import type { AxiosInstance } from 'axios';

export const _cache: { axiosInstance: AxiosInstance | null } = {
	axiosInstance: null,
};

export async function getAxios() {
	if (!_cache.axiosInstance) {
		const axios = (await import('axios')).default;
		const { Agent: AgentHttp } = await import('node:http');
		const { Agent: AgentHttps } = await import('node:https');
		const { agentWithIpValidation } = await import('./agent-with-ip-validation.js');

		const httpAgent = agentWithIpValidation(new AgentHttp());
		const httpsAgent = agentWithIpValidation(new AgentHttps());

		_cache.axiosInstance = axios.create({ httpAgent, httpsAgent });
	}

	return _cache.axiosInstance;
}
