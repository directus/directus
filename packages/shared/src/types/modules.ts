import { RouteRecordRaw } from 'vue-router';
import { Permission, User } from '../types';

export interface ModuleConfig {
	id: string;
	name: string;
	icon: string;
	color?: string;

	routes: RouteRecordRaw[];
	hidden?: boolean;
	preRegisterCheck?: (user: User, permissions: Permission[]) => Promise<boolean> | boolean;
}
