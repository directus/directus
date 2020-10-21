import axios, { AxiosInstance } from 'axios';
import { ItemsHandler, ServerHandler, UtilsHandler } from './handlers';

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
		return new ItemsHandler(collection, this.axios);
	}

	get server() {
		return new ServerHandler(this.axios);
	}

	get utils() {
		return new UtilsHandler(this.axios);
	}
}

const directus = new DirectusSDK('https://example.com');
