import type { RouteRecordRaw } from 'vue-router';
import type { Permission } from './permissions.js';
import type { User } from './users.js';

export interface ModuleConfig {
	id: string;
	name: string;
	icon: string;
	color?: string;

	routes: RouteRecordRaw[];
	hidden?: boolean;
	preRegisterCheck?: (user: User, permissions: Permission[]) => Promise<boolean> | boolean;
}
