import { RouteConfig } from 'vue-router';
import { Ref } from '@vue/composition-api';
import { User, Permission } from '@/types';

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

export type ModuleContext = {};

export type ModuleDefineParam = ModuleConfig | (() => ModuleConfig);
