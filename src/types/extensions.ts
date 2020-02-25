import { Component } from 'vue';
import Vuei18n from 'vue-i18n';
import { RouteConfig } from 'vue-router';

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

export type Layout = {
	id: string;
	icon: string;
	name: string | Vuei18n.TranslateResult;
};

export type LayoutConfig = {
	id: string;
	icon: string;
	name: string | ((i18n: Vuei18n) => Vuei18n.TranslateResult);
	component: Component;
};
