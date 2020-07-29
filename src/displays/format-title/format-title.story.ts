import { withKnobs, text } from '@storybook/addon-knobs';
import readme from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, computed } from '@vue/composition-api';
import handler from './handler';

export default {
	title: 'Displays / Format Title',
	parameters: { notes: readme },
	decorators: [withPadding, withKnobs],
};

export const basic = () =>
	defineComponent({
		props: {
			val: {
				default: text('Value', 'hello-world'),
			},
		},
		setup(props) {
			const value = computed<string | null>(() => handler(props.val, null, { type: 'string' }));
			return { value };
		},
		template: `
			<div>{{ value }}</div>
		`,
	});
