import readme from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';
import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, array, text } from '@storybook/addon-knobs';
import RawValue from '../../../.storybook/raw-value.vue';

import VSelect from './v-select.vue';

export default {
	title: 'Components / Select',
	parameters: {
		notes: readme,
	},
	decorators: [withKnobs, withPadding],
};

export const basic = () =>
	defineComponent({
		components: { VSelect, RawValue },
		props: {
			items: {
				default: array('Items', ['Item 1', 'Item 2', 'Item 3']),
			},
			placeholder: {
				default: text('Placeholder', 'Enter value...'),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div>
				<v-select :placeholder="placeholder" v-model="value" :items="items" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});

export const multiple = () =>
	defineComponent({
		components: { VSelect, RawValue },
		props: {
			items: {
				default: array('Items', ['Item 1', 'Item 2', 'Item 3']),
			},
			placeholder: {
				default: text('Placeholder', 'Enter value...'),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div>
				<v-select :placeholder="placeholder" v-model="value" :items="items" multiple />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
