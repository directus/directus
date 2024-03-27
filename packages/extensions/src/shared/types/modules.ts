import type { Permission, User } from '@directus/types';
import type { RouteRecordRaw } from 'vue-router';

export interface ModuleConfig {
	id: string;
	name: string;
	icon: string;

	routes: RouteRecordRaw[];
	hidden?: boolean;
	preRegisterCheck?: (user: User, permissions: Permission[]) => Promise<boolean> | boolean;
}
