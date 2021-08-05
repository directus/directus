import { Ref } from 'vue';
import { RouteRecordRaw } from 'vue-router';
import { Permission, User } from '../types';
import { ServerInfo } from './server-info';

export interface ModuleConfig {
	id: string;
	name: string;
	hidden?: boolean | Ref<boolean>;
	icon: string;
	routes?: RouteRecordRaw[];
	link?: string;
	color?: string;
	preRegisterCheck?: (user: User, permissions: Permission[], settings: ServerInfo | null) => Promise<boolean> | boolean;
	order?: number;
	persistent?: boolean;
}
