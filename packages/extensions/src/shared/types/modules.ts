import type { CollectionAccess, User } from '@directus/types';
import type { RouteRecordRaw } from 'vue-router';

type AppUser = User & { app_access: boolean; admin_access: boolean };

export interface ModuleConfig {
	id: string;
	name: string;
	icon: string;

	routes: RouteRecordRaw[];
	hidden?: boolean;
	preRegisterCheck?: (user: AppUser, permissions: CollectionAccess) => Promise<boolean> | boolean;
}
