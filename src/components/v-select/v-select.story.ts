import readme from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';
import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, array, text, boolean } from '@storybook/addon-knobs';
import RawValue from '../../../.storybook/raw-value.vue';
import i18n from '@/lang';

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
		i18n,
		components: { VSelect, RawValue },
		props: {
			items: {
				default: array('Items', ['Item 1', 'Item 2', 'Item 3']),
			},
			placeholder: {
				default: text('Placeholder', 'Enter value...'),
			},
			showDeselect: {
				default: boolean('Show Deselect', false),
			},
			allowOther: {
				default: boolean('Allow Other', false),
			},
			inline: {
				default: boolean('Inline', false),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<v-select
					:show-deselect="showDeselect"
					:allow-other="allowOther"
					:placeholder="placeholder"
					v-model="value"
					:items="items"
					:inline="inline"
				/>
				<raw-value>{{ value }}</raw-value>
				<portal-target name="outlet" />
			</div>
		`,
	});

export const multiple = () =>
	defineComponent({
		i18n,
		components: { VSelect, RawValue },
		props: {
			items: {
				default: array('Items', ['Item 1', 'Item 2', 'Item 3']),
			},
			placeholder: {
				default: text('Placeholder', 'Enter value...'),
			},
			showDeselect: {
				default: boolean('Show Deselect', false),
			},
			allowOther: {
				default: boolean('Allow Other', false),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<v-select
					:show-deselect="showDeselect"
					:allow-other="allowOther"
					:placeholder="placeholder"
					v-model="value"
					:items="items"
					multiple
				/>
				<raw-value>{{ value }}</raw-value>
				<portal-target name="outlet" />
			</div>
		`,
	});
