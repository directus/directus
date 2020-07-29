import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, text, object } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Displays / Status (Dot)',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

const defaultStatusMapping = {
	published: {
		name: 'Published',
		value: 'published',
		text_color: '#fff',
		background_color: 'var(--primary)',
	},
	draft: {
		name: 'Draft',
		value: 'draft',
		text_color: 'var(--primary-subdued)',
		background_color: 'var(--background-subdued)',
	},
	deleted: {
		name: 'Deleted',
		value: 'deleted',
		text_color: 'var(--danger)',
		background_color: 'var(--danger-alt)',
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: text('Value', 'published'),
			},
			statusMapping: {
				default: object('Status Mapping', defaultStatusMapping),
			},
		},
		template: `
			<display-status-dot
				:value="value"
				:interface-options="{
					status_mapping: statusMapping,
				}"
			/>
		`,
	});
