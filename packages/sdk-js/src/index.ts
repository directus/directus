import axios, { AxiosInstance } from 'axios';
import {
	ItemsHandler,
	ServerHandler,
	UtilsHandler,
	ActivityHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
} from './handlers';

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
		if (collection.startsWith('directus_')) {
			throw new Error(`You can't read the "${collection}" collection directly.`);
		}

		return new ItemsHandler(collection, this.axios);
	}

	get server() {
		return new ServerHandler(this.axios);
	}

	get utils() {
		return new UtilsHandler(this.axios);
	}

	get activity() {
		return new ActivityHandler(this.axios);
	}

	get folders() {
		return new FoldersHandler(this.axios);
	}

	get permissions() {
		return new PermissionsHandler(this.axios);
	}

	get presets() {
		return new PresetsHandler(this.axios);
	}
}
