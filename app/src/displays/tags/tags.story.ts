import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, array } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Displays / Tags',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: array('Value', ['vip', 'executive']),
			},
		},
		template: `
			<display-tags :value="value" />
		`,
	});
