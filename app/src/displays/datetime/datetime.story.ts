import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, date, select } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent, ref, watch } from '@vue/composition-api';

export default {
	title: 'Displays / Datetime',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			value: {
				default: date('Value', new Date()),
			},
			type: {
				default: select('Type', ['date', 'time', 'datetime'], 'datetime'),
			},
		},
		setup(props) {
			const val = ref(new Date(props.value).toISOString());
			watch(
				() => props.value,
				() => (val.value = new Date(props.value).toISOString())
			);
			return { val };
		},
		template: `
      <display-datetime :value="val" :type="type"/>
    `,
	});
