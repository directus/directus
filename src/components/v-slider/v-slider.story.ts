import { action } from '@storybook/addon-actions';
import { withKnobs, color, boolean, number } from '@storybook/addon-knobs';
import Vue from 'vue';
import markdown from './readme.md';
import VIcon from '../v-icon/';
import VSlider from './v-slider.vue';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-slider', VSlider);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Slider',
	decorators: [withKnobs, withPadding],
	component: VSlider,
	parameters: {
		notes: markdown,
	},
};

export const interactive = () => ({
	data() {
		return {
			value: 15,
		};
	},
	props: {
		trackColor: {
			default: color('Track Color', '#cfd8dc'),
		},
		trackFillColor: {
			default: color('Track Fill Color', '#37474f'),
		},
		thumbColor: {
			default: color('Thumb Color', '#37474f'),
		},
		showThumbLabel: {
			default: boolean('Show Thumb Label', false),
		},
		showTicks: {
			default: boolean('Show Ticks', false),
		},
		max: {
			default: number('Max value', 25),
		},
		min: {
			default: number('Min value', 5),
		},
		step: {
			default: number('Step', 1),
		},
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
		clickPrepend: action('click:prepend'),
		clickAppend: action('click:append'),
	},
	template: `
<div>
<v-slider
	v-model="value"
	:style="{
		'--v-slider-color': trackColor,
		'--v-slider-fill-color': trackFillColor,
		'--v-slider-thumb-color': thumbColor
	}"
	:max="max"
	:min="min"
	:show-ticks="showTicks"
	:show-thumb-label="showThumbLabel"
	@input="onInput"
	@change="onChange"
/>
<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">
value: {{value}}
</pre>
</div>
`,
});

export const withTicks = () => ({
	data() {
		return {
			value: 12,
		};
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
		clickPrepend: action('click:prepend'),
		clickAppend: action('click:append'),
	},
	template: `
<v-slider
	v-model="value"
	:min="5"
	:max="15"
	show-ticks
	@input="onInput"
	@change="onChange"
/>
`,
});

export const withThumbLabel = () => ({
	data() {
		return {
			value: 12,
		};
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
		clickPrepend: action('click:prepend'),
		clickAppend: action('click:append'),
	},
	template: `
<v-slider
	:min="5"
	:max="15"
	v-model="value"
	show-thumb-label
	@input="onInput"
	@change="onChange"
/>
`,
});

export const appendSlot = () => ({
	data() {
		return {
			value: 12,
		};
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
		clickPrepend: action('click:prepend'),
		clickAppend: action('click:append'),
	},
	template: `
<v-slider
	:min="5"
	:max="15"
	v-model="value"
	show-thumb-label
	@input="onInput"
	@change="onChange"
>
	<template #append>
		{{ value }} / 15
	</template>
</v-slider>
`,
});

export const prependSlot = () => ({
	data() {
		return {
			value: 12,
		};
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
		clickPrepend: action('click:prepend'),
		clickAppend: action('click:append'),
	},
	template: `
<v-slider
	:min="5"
	:max="15"
	v-model="value"
	show-thumb-label
	@input="onInput"
	@change="onChange"
>
	<template #prepend>
		<v-icon name="star" />
	</template>
</v-slider>
`,
});

export const slots = () => ({
	data() {
		return {
			value: 12,
		};
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
		clickMinus() {
			if ((this as any).value > 5) {
				(this as any).value = (this as any).value - 1;
			}
		},
		clickPlus() {
			if ((this as any).value < 15) {
				(this as any).value = (this as any).value + 1;
			}
		},
	},
	template: `
<v-slider
	:min="5"
	:max="15"
	v-model="value"
	show-thumb-label
	@input="onInput"
	@change="onChange"
>
	<template #prepend>
		<v-icon name="remove" @click="clickMinus" />
	</template>
	<template #append>
		<v-icon name="add" @click="clickPlus" />
	</template>
</v-slider>
`,
});

export const thumbLabelSlot = () => ({
	data() {
		return {
			value: 12,
		};
	},
	methods: {
		onInput: action('input'),
		onChange: action('change'),
	},
	template: `
<v-slider
	:min="5"
	:max="15"
	v-model="value"
	show-thumb-label
	@input="onInput"
	@change="onChange"
>
	<template #thumb-label>
		Units: {{ value }}
	</template>
</v-slider>
`,
});
