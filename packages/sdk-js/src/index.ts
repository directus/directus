import axios, { AxiosInstance } from 'axios';
import { Items } from './handlers/items';

export default class DirectusSDK {
	axios: AxiosInstance;

	constructor(url: string) {
		this.axios = axios.create({
			baseURL: url,
		});
	}

	get url() {
		return this.axios.defaults.baseURL!;
	}

	set url(val: string) {
		this.axios.defaults.baseURL = val;
	}

	items(collection: string) {
		return new Items(collection, this.axios);
	}
}
