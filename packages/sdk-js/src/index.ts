import axios, { AxiosInstance } from 'axios';
import {
	ItemsHandler,
	ServerHandler,
	UtilsHandler,
	ActivityHandler,
	FoldersHandler,
	PermissionsHandler,
	PresetsHandler,
	RolesHandler,
	UsersHandler,
	SettingsHandler,
	FilesHandler,
	CollectionsHandler,
	FieldsHandler,
	AuthHandler,
	RelationsHandler,
	AuthOptions,
	RevisionsHandler,
} from './handlers';
import { MemoryStore } from './utils';

class DirectusSDK {
	axios: AxiosInstance;
	private authOptions: AuthOptions;

	constructor(url: string, options?: { auth: Partial<AuthOptions> }) {
		this.axios = axios.create({
			baseURL: url,
		});

		this.authOptions = {
			storage: options?.auth?.storage !== undefined ? options.auth.storage : new MemoryStore(),
			mode: options?.auth?.mode !== undefined ? options.auth.mode : 'cookie',
			autoRefresh: options?.auth?.autoRefresh !== undefined ? options.auth.autoRefresh : false,
		};
	}

	// Global helpers
	////////////////////////////////////////////////////////////////////////////////////////////////

	get url(): string {
		return this.axios.defaults.baseURL!;
	}

	set url(val: string) {
		this.axios.defaults.baseURL = val;
	}

	// Handlers
	////////////////////////////////////////////////////////////////////////////////////////////////

	items(collection: string) {
		if (collection.startsWith('directus_')) {
			throw new Error(`You can't read the "${collection}" collection directly.`);
		}

		return new ItemsHandler(collection, this.axios);
	}

	get activity() {
		return new ActivityHandler(this.axios);
	}

	get auth() {
		return new AuthHandler(this.axios, this.authOptions);
	}

	get collections() {
		return new CollectionsHandler(this.axios);
	}

	get fields() {
		return new FieldsHandler(this.axios);
	}

	get files() {
		return new FilesHandler(this.axios);
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

	get relations() {
		return new RelationsHandler(this.axios);
	}

	get revisions() {
		return new RevisionsHandler(this.axios);
	}

	get roles() {
		return new RolesHandler(this.axios);
	}

	get server() {
		return new ServerHandler(this.axios);
	}

	get settings() {
		return new SettingsHandler(this.axios);
	}

	get users() {
		return new UsersHandler(this.axios);
	}

	get utils() {
		return new UtilsHandler(this.axios);
	}
}

export default DirectusSDK;
