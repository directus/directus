import { withKnobs } from '@storybook/addon-knobs';
import Vue from 'vue';
import VInput from './v-input.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-input', VInput);
Vue.directive('focus', {});

export default {
	title: 'Components / Input',
	component: VInput,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const basic = () => ({
	data() {
		return {
			value: ''
		};
	},
	template: `
<div>
<v-input v-model="value" placeholder="Enter content..." />
<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">
value: {{ value }}
</pre>
</div>
`
});

export const monospace = () => ({
	data() {
		return {
			value: ''
		};
	},
	template: `
<div>
<v-input v-model="value" placeholder="Enter content..." monospace />
</div>
`
});

export const disabled = () => `<v-input value="I'm disabled" disabled />`;

export const fullWidth = () => `
<v-input placeholder="Enter content..." full-width />
`;

export const prefixSuffix = () => `
<div>
<v-input prefix="$" value="14.99" style="margin-bottom: 20px" />
<v-input suffix="@rngr.org" value="rijk" />
</div>
`;

export const withSlots = () => ({
	data() {
		return {
			value: ''
		};
	},
	template: `
	<div>
	<v-input style="margin-bottom: 20px">
		<template #prepend-outer><v-icon name="star" /></template>
		<template #prepend><v-icon name="alarm" /></template>
		<template #append><v-icon name="clear" /></template>
		<template #append-outer><v-icon name="star" /></template>
	</v-input>
	<v-input style="margin-bottom: 20px">
		<template #append><v-button small>Search</v-button></template>
	</v-input>
	<v-input v-model="value" style="margin-bottom: 20px">
		<template #append-outer>{{value.length}} / 100</template>
	</v-input>
	<v-input>
		<template #prepend-outer>prepend-outer</template>
		<template #prepend>prepend</template>
		<template #append-outer>append-outer</template>
		<template #append>append</template>
	</v-input>
	</div>
	`
});
