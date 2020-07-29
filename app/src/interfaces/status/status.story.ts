import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import { boolean, withKnobs, object } from '@storybook/addon-knobs';
import readme from './readme.md';
import RawValue from '../../../.storybook/raw-value.vue';
import i18n from '@/lang';

export default {
	title: 'Interfaces / Status',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		i18n,
		components: { RawValue },
		props: {
			statusMapping: {
				default: object('Status Mapping', {
					published: {
						name: 'Published',
						background_color: 'var(--primary)',
					},
					draft: {
						name: 'Draft',
						background_color: 'var(--background-normal)',
					},
					deleted: {
						name: 'Deleted',
						background_color: 'var(--danger)',
					},
				}),
			},
			disabled: {
				default: boolean('Disabled', false),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<interface-status
					v-model="value"
					:status_mapping="statusMapping"
					:disabled="disabled"
				/>
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
