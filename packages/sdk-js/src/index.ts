import { AxiosInstance } from 'axios';
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
import { DirectusOptions } from './types';
import { MemoryStore, BrowserStore } from './utils';
import { createAxiosInstance } from './utils/create-axios';

class DirectusSDK {
	axios: AxiosInstance;
	private authOptions: AuthOptions;

	constructor(url: string, options?: DirectusOptions) {
		this.axios = createAxiosInstance({
			baseURL: url,
			withCredentials: true,
			...(options?.axiosConfig ?? {}),
		});

		this.authOptions = {
			storage: options?.auth?.storage ?? (typeof window === 'undefined' ? new MemoryStore() : new BrowserStore()),
			mode: options?.auth?.mode ?? 'cookie',
			autoRefresh: options?.auth?.autoRefresh ?? false,
		};

		this.auth = new AuthHandler(this.axios, this.authOptions);
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
	auth: AuthHandler;

	items(collection: string): ItemsHandler {
		if (collection.startsWith('directus_')) {
			throw new Error(`You can't read the "${collection}" collection directly.`);
		}

		return new ItemsHandler(collection, this.axios);
	}

	get activity(): ActivityHandler {
		return new ActivityHandler(this.axios);
	}

	get collections(): CollectionsHandler {
		return new CollectionsHandler(this.axios);
	}

	get fields(): FieldsHandler {
		return new FieldsHandler(this.axios);
	}

	get files(): FilesHandler {
		return new FilesHandler(this.axios);
	}

	get folders(): FoldersHandler {
		return new FoldersHandler(this.axios);
	}

	get permissions(): PermissionsHandler {
		return new PermissionsHandler(this.axios);
	}

	get presets(): PresetsHandler {
		return new PresetsHandler(this.axios);
	}

	get relations(): RelationsHandler {
		return new RelationsHandler(this.axios);
	}

	get revisions(): RevisionsHandler {
		return new RevisionsHandler(this.axios);
	}

	get roles(): RolesHandler {
		return new RolesHandler(this.axios);
	}

	get server(): ServerHandler {
		return new ServerHandler(this.axios);
	}

	get settings(): SettingsHandler {
		return new SettingsHandler(this.axios);
	}

	get users(): UsersHandler {
		return new UsersHandler(this.axios);
	}

	get utils(): UtilsHandler {
		return new UtilsHandler(this.axios);
	}
}

export default DirectusSDK;
