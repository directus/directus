import VueI18n from 'vue-i18n';
import { RouteConfig } from 'vue-router';

export type ModuleConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	routes: RouteConfig[];
};

export type ModuleContext = { i18n: VueI18n };

export type ModuleDefineParam = ModuleConfig | ((context: ModuleContext) => ModuleConfig);
