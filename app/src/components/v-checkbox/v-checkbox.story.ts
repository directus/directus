import { withKnobs, color, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VCheckbox from '../v-checkbox';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';

Vue.component('v-checkbox', VCheckbox);

export default {
	title: 'Components / Checkbox',
	component: VCheckbox,
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
		<v-checkbox v-model="checked" @change="onChange" />
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
		<v-checkbox v-model="options" value="html" @change="onChange" label="HTML" />
		<v-checkbox v-model="options" value="css" @change="onChange" label="CSS" />
		<v-checkbox v-model="options" value="js" @change="onChange" label="JS" />
		<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">{{options}}</pre>
	</div>
	`,
});

export const disabled = () =>
	`<div><v-checkbox label="Disabled" disabled /><v-checkbox :inputValue="true" label="Disabled" disabled /></div>`;

export const indeterminate = () => ({
	data() {
		return {
			indeterminate: true,
			value: null,
		};
	},
	template: `<div>
	<v-checkbox label="Indeterminate" v-model="value" :indeterminate.sync="indeterminate" />
	<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">
indeterminate: {{indeterminate}}
value: {{value}}
</pre>
	</div>`,
});

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
		<v-checkbox v-model="options" value="red" @change="onChange" :style="{'--v-checkbox-color': 'var(--danger)'}" label="Danger" />
		<v-checkbox v-model="options" value="blue" @change="onChange" :style="{'--v-checkbox-color': 'var(--primary)'}" label="Primary" />
		<v-checkbox v-model="options" value="yellow" @change="onChange" :style="{'--v-checkbox-color': 'var(--secondary)'}" label="Secondary" />
		<v-checkbox v-model="options" value="custom" @change="onChange" :style="{'--v-checkbox-color': customColor}" label="Custom..." />
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
		<v-checkbox v-model="checked" @change="onChange">
			<template>
				Any <i>custom</i> markup in here
			</template>
		</v-checkbox>
	`,
});

export const slots = () => ({
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
		<v-checkbox v-model="checked" @change="onChange" label="Checkbox">
			<template #prepend>
				<v-sheet style="--v-sheet-min-height: 0; --v-sheet-background-color: var(--primary-alt);">Prepend</v-sheet>
			</template>

			<template #append>
				<v-sheet style="--v-sheet-min-height: 0; --v-sheet-background-color: var(--secondary-alt);">Append</v-sheet>
			</template>
		</v-checkbox>
	</div>
	`,
});

export const customIcons = () =>
	defineComponent({
		props: {
			iconOn: {
				default: text('Icon (On)', 'check'),
			},
			iconOff: {
				default: text('Icon (Off)', 'close'),
			},
			iconIndeterminate: {
				default: text('Icon (Indeterminate)', 'more_horiz'),
			},
		},
		setup() {
			const checked = ref(false);
			const indeterminate = ref(false);
			return { checked, indeterminate };
		},
		template: `
			<div>
				<v-checkbox
					v-model="checked"
					:indeterminate.sync="indeterminate"
					:icon-on="iconOn"
					:icon-off="iconOff"
					:icon-indeterminate="iconIndeterminate"
					label="Checkbox"
				/>
				<v-checkbox style="margin-top: 32px;" v-model="indeterminate" label="Indeterminate" />
			</div>
		`,
	});

export const blockStyle = () =>
	defineComponent({
		setup() {
			const checked = ref(false);
			const indeterminate = ref(false);
			return { checked, indeterminate };
		},
		template: `
			<v-checkbox
				style="max-width: 300px;"
				v-model="checked"
				label="Checkbox"
				block
			/>
		`,
	});
