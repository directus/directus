import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import { withKnobs, array, boolean } from '@storybook/addon-knobs';
import i18n from '@/lang';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / Color',
	decorators: [withPadding, withKnobs],
};

export const basic = () =>
	defineComponent({
		i18n,
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
			presets: {
				default: array('Preset Colors', [
					'#EB5757',
					'#F2994A',
					'#F2C94C',
					'#6FCF97',
					'#27AE60',
					'#56CCF2',
					'#2F80ED',
					'#9B51E0',
					'#BB6BD9',
					'#607D8B',
				]),
			},
		},
		setup() {
			const value = ref('');
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<interface-color
					v-model="value"
					:presets="presets"
					:disabled="disabled"
				/>
				<portal-target multiple name="outlet" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
