import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, number } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent, watch, ref } from '@vue/composition-api';
import DisplayFilesize from './index';

export default {
	title: 'Displays / Filesize',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: number('Value', 1024 * 1024),
			},
		},
		setup(props) {
			const val = ref(props.value);
			watch(
				() => props.value,
				() => {
					const handler = DisplayFilesize.handler as Function;
					val.value = handler(props.value);
				}
			);
			return { val };
		},
		template: `
      <div>{{ val }}</div>
    `,
	});
