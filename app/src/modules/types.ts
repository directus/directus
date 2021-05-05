import { Permission, User } from '@/types';
import { Ref } from '@vue/composition-api';
import { RouteConfig } from 'vue-router';

export interface ModuleConfig {
	id: string;
	name: string;
	hidden?: boolean | Ref<boolean>;
	icon: string;
	routes?: RouteConfig[];
	link?: string;
	color?: string;
	preRegisterCheck?: (user: User, permissions: Permission[]) => boolean;
	order?: number;
	persistent?: boolean;
}

export type ModuleContext = Record<string, unknown>;

export type ModuleDefineParam = ModuleConfig | (() => ModuleConfig);
