import registerComponent from '@/utils/register-component/';
import { getDisplays } from './index';
import { Component } from 'vue';

const displays = getDisplays();

const context = require.context('.', true, /^.*index\.ts$/);
const modules = context
	.keys()
	.map((key) => context(key))
	.map((mod) => mod.default)
	.filter((m) => m);

displays.value = modules;

displays.value.forEach((display) => {
	if (typeof display.handler !== 'function') {
		registerComponent('display-' + display.id, display.handler as Component);
	}

	if (typeof display.options !== 'function') {
		registerComponent('display-options-' + display.id, display.options as Component);
	}
});
