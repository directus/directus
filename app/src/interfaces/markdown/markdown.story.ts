import { withKnobs, boolean, text, optionsKnob } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import InterfaceMarkdown from './markdown.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';
import i18n from '@/lang';

Vue.component('interface-markdown', InterfaceMarkdown);

export default {
	title: 'Interfaces / Markdown',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		i18n,
		props: {
			disabled: {
				default: boolean('Disabled', false, 'Options'),
			},
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options'),
			},
			tabbed: {
				default: boolean('Tabbed', false, 'Options'),
			},
		},
		setup() {
			const value = ref('');
			const onInput = action('input');
			return { onInput, value };
		},
		template: `
		<div>
			<interface-markdown
				v-model="value"
				v-bind="{ placeholder, tabbed, disabled }"
				@input="onInput"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
