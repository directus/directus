import Vuei18n from 'vue-i18n';
import { RouteConfig } from 'vue-router';
import { i18n } from '@/lang/';

export type Module = {
	id: string;
	icon: string;
	name: string | Vuei18n.TranslateResult;
};

export type ModuleConfig = {
	id: string;
	routes: RouteConfig[];
	icon: string;
	name: string | ((i18n: Vuei18n) => Vuei18n.TranslateResult);
};
