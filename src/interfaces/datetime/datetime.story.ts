import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref, watch } from '@vue/composition-api';
import { withKnobs, select } from '@storybook/addon-knobs';
import readme from './readme.md';
import i18n from '@/lang';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / DateTime',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		i18n,
		props: {
			type: {
				default: select('Type', ['datetime', 'date', 'time'], 'datetime'),
			},
		},
		components: { RawValue },
		setup(props) {
			const value = ref('2020-04-28 14:40:00');

			watch(
				() => props.type,
				(newType: string) => {
					if (newType === 'datetime') {
						value.value = '2020-04-28 14:40:00';
					} else if (newType === 'time') {
						value.value = '14:40:00';
					} else {
						// date
						value.value = '2020-04-28';
					}
				}
			);

			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<interface-datetime
					v-model="value"
					:type="type"
				/>
				<portal-target multiple name="outlet" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
