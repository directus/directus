import readme from './readme.md';
import { withKnobs, select } from '@storybook/addon-knobs';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Components / Skeleton Loader',
	parameters: {
		notes: readme,
	},
	decorators: [withPadding, withKnobs],
};

export const basic = () =>
	defineComponent({
		props: {
			type: {
				default: select('Type', ['input', 'input-tall', 'list-item-icon'], 'input'),
			},
		},
		template: `
			<v-skeleton-loader :type="type" />
		`,
	});
