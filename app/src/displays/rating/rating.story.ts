import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, number } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Displays / Rating',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: number('Value', 2, { max: 5, min: 0, step: 1 }),
			},
		},
		template: `
    <div style="max-width: 300px;">
      <display-rating :value="value"/>
    </div>
    `,
	});
