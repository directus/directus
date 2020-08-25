import { withKnobs, color } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VSwitch from '../v-switch/';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-switch', VSwitch);

export default {
	title: 'Components / Switch',
	component: VSwitch,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const booleanState = () => ({
	methods: {
		onChange: action('change'),
	},
	data() {
		return {
			checked: false,
		};
	},
	template: `
	<div>
		<v-switch v-model="checked" @change="onChange" />
		<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">{{checked}}</pre>
	</div>
	`,
});

export const arrayState = () => ({
	methods: {
		onChange: action('change'),
	},
	data() {
		return {
			options: ['html', 'css'],
		};
	},
	template: `
	<div>
		<v-switch style="margin-bottom: 20px" v-model="options" value="html" @change="onChange" label="HTML" />
		<v-switch style="margin-bottom: 20px" v-model="options" value="css" @change="onChange" label="CSS" />
		<v-switch style="margin-bottom: 20px" v-model="options" value="js" @change="onChange" label="JS" />
		<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">{{options}}</pre>
	</div>
	`,
});

export const disabled = () =>
	`<div><v-switch style="margin-bottom: 20px" label="Disabled" disabled /><v-switch style="margin-bottom: 20px" :inputValue="true" label="Disabled" disabled /></div>`;

export const colors = () => ({
	methods: {
		onChange: action('change'),
	},
	data() {
		return {
			options: ['red', 'yellow', 'custom'],
		};
	},
	props: {
		customColor: {
			default: color('Custom color', '#4CAF50'),
		},
	},
	template: `
	<div>
		<v-switch v-model="options" value="red" @change="onChange" style="margin-bottom: 20px; --v-switch-color: var(--red)" label="Red" />
		<v-switch v-model="options" value="blue" @change="onChange" style="margin-bottom: 20px; --v-switch-color: var(--blue)" label="Blue" />
		<v-switch v-model="options" value="yellow" @change="onChange" style="margin-bottom: 20px; --v-switch-color: var(--amber)" label="Yellow" />
		<v-switch style="margin-bottom: 20px;" v-model="options" value="custom" @change="onChange" :style="{'--v-switch-color': customColor}" label="Custom..." />
	</div>
	`,
});

export const htmlLabel = () => ({
	methods: {
		onChange: action('change'),
	},
	data() {
		return {
			checked: true,
		};
	},
	template: `
		<v-switch v-model="checked" @change="onChange">
			<template>
				Any <i>custom</i> markup in here
			</template>
		</v-switch>
	`,
});
