import VueI18n from 'vue-i18n';
import { Component } from 'vue';

export type InterfaceOptions = {
	id: string;
	register: (context: InterfaceContext) => InterfaceConfig;
};

export interface InterfaceConfig {
	icon: string;
	name: string | VueI18n.TranslateResult;
	component: Component;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	display: null | ((value: any) => string) | Component;
}

export interface Interface extends InterfaceConfig {
	id: string;
}

export type InterfaceContext = { i18n: VueI18n };
