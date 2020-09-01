import registerComponent from '@/utils/register-component/';
import { getInterfaces } from './index';
import { Component } from 'vue';

const interfaces = getInterfaces();

const context = require.context('.', true, /^.*index\.ts$/);
const modules = context
	.keys()
	.map((key) => context(key))
	.map((mod) => mod.default)
	.filter((m) => m);

interfaces.value = modules;

interfaces.value.forEach((inter) => {
	registerComponent('interface-' + inter.id, inter.component);

	if (typeof inter.options !== 'function' && Array.isArray(inter.options) === false) {
		registerComponent(`interface-options-${inter.id}`, inter.options as Component);
	}
});
