import router from '@/router';
import { ModuleConfig } from '@/modules/types';

import CollectionsModule from './collections/';
import FilesModule from './files/';
import SettingsModule from './settings/';
import UsersModule from './users/';

// The core modules are available regardless of project, so they can be registered immediately
[CollectionsModule, FilesModule, SettingsModule, UsersModule].forEach(registerModule);

export function registerModule(config: ModuleConfig) {
	const routes = config.routes.map(route => ({
		...route,
		path: `/:project/${config.id}${route.path}`
	}));

	router.addRoutes(routes);
}

/**
 * @NOTE
 * The system modules that are registered here will most likely have to be re-registered on login
 * as reset the router on logout to prevent custom modules from persisting between project switches
 * wrongly
 */
