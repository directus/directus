import { defineComponent } from '@vue/composition-api';
import { withKnobs, text } from '@storybook/addon-knobs';
import readme from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

export default {
	title: 'Displays / Icon',
	parameters: {
		notes: readme,
	},
	decorators: [withKnobs, withPadding],
};

export const basic = () =>
	defineComponent({
		props: {
			iconName: {
				default: text('Icon Name', 'subject'),
			},
		},
		template: `
			<display-icon :icon-name="iconName" />
		`,
	});
