import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, text, select, boolean } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Displays / Formatted Text',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: text('Value', 'This is the value of the field'),
			},
			bold: {
				default: boolean('Bold', false),
			},
			subdued: {
				default: boolean('Subdued', false),
			},
			font: {
				default: select('Font', ['sans-serif', 'serif', 'monospace'], 'sans-serif'),
			},
		},
		template: `
			<display-formatted-text
				:value="value"
				:bold="bold"
				:subdued="subdued"
				:font="font"
			/>
		`,
	});
