import type { RouteRecordRaw } from 'vue-router';
import type { CollectionAccess } from '../permissions.js';
import type { User } from '../users.js';

type AppUser = User & { app_access: boolean; admin_access: boolean };

export interface ModuleConfig {
	id: string;
	name: string;
	icon: string;
	routes: RouteRecordRaw[];
	hidden?: boolean;
	preRegisterCheck?: (user: AppUser, permissions: CollectionAccess) => Promise<boolean> | boolean;
}
