import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, text } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent, ref, watch } from '@vue/composition-api';
import DisplayMimeType from './index';

export default {
	title: 'Displays / MimeType',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: text('Value', 'image/png'),
			},
		},
		setup(props) {
			const val = ref(props.value);
			watch(
				() => props.value,
				() => {
					const handler = DisplayMimeType.handler as Function;
					val.value = handler(props.value);
				}
			);
			return { val };
		},
		template: `
      <div>{{ val }}</div>
    `,
	});
