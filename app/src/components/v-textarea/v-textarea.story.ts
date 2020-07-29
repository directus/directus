import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import Vue from 'vue';
import readme from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';

Vue.directive('focus', {});

export default {
	title: 'Components / Textarea',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
			trim: {
				default: boolean('Trim', false),
			},
			placeholder: {
				default: text('Placeholder', 'Enter a longer value.....'),
			},
			fullWidth: {
				default: boolean('Full Width', false),
			},
			expandOnFocus: {
				default: boolean('Expand on Focus', false),
			},
		},
		setup() {
			const value = ref('');
			return {
				value,
			};
		},
		template: `
			<div>
				<v-textarea
					v-model="value"
					:disabled="disabled"
					:full-width="fullWidth"
					v-bind="{placeholder, trim}"
					:expand-on-focus="expandOnFocus"
				/>
				<raw-value>{{ value }}</raw-value>
			</div>
			`,
	});

export const withSlots = () =>
	defineComponent({
		template: `
			<v-textarea v-model="value">
				<template #prepend>
					<v-sheet
						style="
							--v-sheet-background-color: var(--primary-alt);
							--v-sheet-color: var(--primary);
						">Prepend</v-sheet>
				</template>
				<template #append>
					<v-sheet
						style="
							--v-sheet-background-color: var(--secondary-alt);
							--v-sheet-color: var(--secondary);
						">Append</v-sheet>
				</template>
			</v-textarea>
		`,
	});
