import { RouteRecordRaw } from 'vue-router';
import { Ref } from 'vue';
import { User, Permission } from '@/types';

export interface ModuleConfig {
	id: string;
	name: string;
	hidden?: boolean | Ref<boolean>;
	icon: string;
	routes?: RouteRecordRaw[];
	link?: string;
	color?: string;
	preRegisterCheck?: (user: User, permissions: Permission[]) => boolean;
	order?: number;
	persistent?: boolean;
}

export type ModuleContext = {};

export type ModuleDefineParam = ModuleConfig | (() => ModuleConfig);
