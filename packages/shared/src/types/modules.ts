import { RouteRecordRaw } from 'vue-router';
import { Permission, User } from '../types';

export interface ModuleConfig {
	id: string;
	name: string;
	hidden?: boolean;
	icon: string;
	routes?: RouteRecordRaw[];
	color?: string;
	preRegisterCheck?: (user: User, permissions: Permission[]) => Promise<boolean> | boolean;
}
