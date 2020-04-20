import { withKnobs, color } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent } from '@vue/composition-api';
import VDivider from '@/components/v-divider';

export default {
	title: 'Interfaces / Divider',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: {
			VDivider,
		},
		props: {
			color: {
				default: color('Color', '#d6dfe2'),
			},
		},
		template: `
			<interface-divider :color="color" />
		`,
	});
