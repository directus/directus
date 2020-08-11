import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import Vue from 'vue';
import VInput from './v-input.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import VMenu from '@/components/v-menu';
import RawValue from '../../../.storybook/raw-value.vue';

Vue.component('v-input', VInput);
Vue.directive('focus', {});

export default {
	title: 'Components / Input',
	component: VInput,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		props: {
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options'),
			},
			trim: {
				default: boolean('Trim', false, 'Options'),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div>
				<v-input v-model="value" v-bind="{placeholder, trim}" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});

export const monospace = () => ({
	data() {
		return {
			value: '',
		};
	},
	template: `
<div>
<v-input v-model="value" placeholder="Enter content..." :style="{'--v-input-font-family': 'var(--family-monospace)'}" />
</div>
`,
});

export const disabled = () => `<v-input value="I'm disabled" disabled />`;

export const fullWidth = () => `
<v-input placeholder="Enter content..." />
`;

export const forceSlug = () =>
	defineComponent({
		components: { RawValue },
		props: {
			separator: {
				default: text('Slug Separator', '-'),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div>
				<v-input slug :slug-separator="separator" v-model="value" placeholder="Enter url friendly title..." />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});

export const prefixSuffix = () => `
<div>
<v-input prefix="$" value="14.99" style="margin-bottom: 20px" />
<v-input suffix="@rngr.org" value="rijk" />
</div>
`;

export const withSlots = () => ({
	data() {
		return {
			value: '',
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
	`,
});

export const withMenu = () =>
	defineComponent({
		components: { VMenu },
		template: `
			<div>
				<v-menu placement="bottom-start" attached>
					<template #activator="{ toggle, active }">
						<v-input placeholder="Enter value...">
							<template #append><v-icon @click="toggle" name="public" :style="{
								'--v-icon-color': active ? 'var(--blue)' : 'currentColor'
							}" /></template>
						</v-input>
					</template>

					<v-list>
						<v-list-item v-for="i in [1, 2, 3]" :key="i" @click="() => {}">
							Item {{i}}
						</v-list-item>
					</v-list>
				</v-menu>
				<portal-target name="outlet" />
			</div>
		`,
	});
