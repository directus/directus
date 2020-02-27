import VueI18n from 'vue-i18n';
import { RouteConfig } from 'vue-router';

export type ModuleOptions = {
	id: string;
	register: (context: ModuleContext) => ModuleConfig;
};

export interface ModuleConfig {
	routes: RouteConfig[];
	icon: string;
	name: string | VueI18n.TranslateResult;
}

export interface Module extends ModuleConfig {
	id: string;
}

export type ModuleContext = { i18n: VueI18n };
