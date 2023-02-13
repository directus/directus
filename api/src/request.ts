import type { AxiosInstance } from 'axios';
import { lookup } from 'node:dns/promises';
import net from 'node:net';
import os from 'node:os';
import env from './env';

let axiosInstance: AxiosInstance;

export async function getAxios() {
	if (!axiosInstance) {
		const axios = (await import('axios')).default;

		axiosInstance = axios.create();

		axiosInstance.interceptors.request.use(async (config) => {
			if (config.url) {
				await checkUrl(config.url);
			}
			return config;
		});
	}

	return axiosInstance;
}

async function checkUrl(url: string) {
	let parsedUrl;

	try {
		parsedUrl = new URL(url);
	} catch {
		throw new Error(`Requested URL "${url}" is invalid`);
	}

	let ip = parsedUrl.hostname;

	if (net.isIP(ip) === 0) {
		try {
			ip = (await lookup(ip)).address;
		} catch (err: any) {
			throw new Error(`Couldn't lookup the DNS for URL "${url}" (${err.message || err})`);
		}
	}

	if (env.IMPORT_IP_DENY_LIST.includes('0.0.0.0')) {
		const networkInterfaces = os.networkInterfaces();

		for (const networkInfo of Object.values(networkInterfaces)) {
			if (!networkInfo) continue;

			for (const info of networkInfo) {
				if (info.address === ip) {
					throw new Error(`Requested URL "${url}" resolves to localhost`);
				}
			}
		}
	}

	if (env.IMPORT_IP_DENY_LIST.includes(ip)) {
		throw new Error(`Requested URL "${url}" resolves to a denied IP address`);
	}
}
